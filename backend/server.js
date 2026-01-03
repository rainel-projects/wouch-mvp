import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import supabase from './config/supabase.js';
import { getOnboardingState, updateFlowState } from './services/flowService.js';
import { applyScoreRules, recalculateScores } from './services/scoringService.js';
import { evaluateBranching, getNextQuestion } from './services/branchingService.js';
import { unlockKaiLesson, completeKaiLesson, getKaiLessonContent } from './services/kaiService.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:8000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

/* ===============================
   MVP API ENDPOINTS
=============================== */

/**
 * GET /onboarding/state
 * Get current onboarding state for a user
 */
app.get('/onboarding/state', async (req, res) => {
  try {
    const { user_id, session_id } = req.query;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'Missing user_id or session_id' });
    }

    const state = await getOnboardingState(user_id, session_id);

    res.json({
      success: true,
      ...state
    });
  } catch (error) {
    console.error('Error in /onboarding/state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /question/:question_code
 * Get question details
 */
app.get('/question/:question_code', async (req, res) => {
  try {
    const { question_code } = req.params;

    const { data: question, error } = await supabase
      .schema('question_master_schema')
      .from('questions')
      .select('*')
      .eq('question_code', question_code)
      .single();

    if (error || !question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Transform options from config_json to frontend format
    // Handle both cases: with opt_id and without opt_id
    const options = (question.config_json?.options || []).map((opt, index) => ({
      id: opt.opt_id || `opt_${index + 1}`,     // Generate ID if missing
      text: opt.text,                            // Keep text
      value: opt.opt_id || opt.text              // Use opt_id or fallback to text
    }));

    // Remove config_json from response and use transformed options
    const { config_json, ...questionData } = question;

    res.json({
      success: true,
      question: {
        ...questionData,
        options,
        question_type: question.question_type || 'single_choice'
      }
    });
  } catch (error) {
    console.error('Error in /question/:question_code:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /answer
 * Submit an answer and advance the flow
 */
app.post('/answer', async (req, res) => {
  try {
    const { user_id, session_id, question_code, response_value } = req.body;

    if (!user_id || !session_id || !question_code || response_value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, session_id, question_code, response_value'
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 Processing answer submission');
    console.log('='.repeat(60));

    // Step 1: Save response with selected_option_ids array (Vicky's schema)
    const responseId = randomUUID();

    // Convert single value to array for selected_option_ids
    const selectedOptionIds = Array.isArray(response_value)
      ? response_value
      : [response_value];

    await supabase
      .schema('journey_engine_schema')
      .from('question_responses')
      .insert({
        id: responseId,
        user_id,
        session_id,
        question_code,
        selected_option_ids: selectedOptionIds,  // Array as per Vicky's schema
        answered_at: new Date().toISOString()
      });

    await supabase
      .schema('journey_engine_schema')
      .from('responses')
      .insert({
        id: responseId,
        user_id,
        session_id,
        question_code,
        response_data: JSON.stringify({ value: response_value }),
        created_at: new Date().toISOString()
      });

    // Step 2: Apply scoring rules
    const { scores, flags } = await applyScoreRules(user_id, session_id, question_code, response_value);

    // Step 3: Evaluate branching
    const branchingResult = await evaluateBranching(user_id, session_id, scores, question_code);

    let nextStepType = branchingResult.stepType;
    let nextStepCode = branchingResult.stepCode;

    // Step 4: Handle branching result
    if (nextStepType === 'KAI') {
      // Unlock KAI lesson
      const lesson = await unlockKaiLesson(user_id, session_id, nextStepCode);
      nextStepCode = lesson.id; // Use lesson ID for frontend
    } else if (nextStepType === 'QUESTION' && nextStepCode === 'next') {
      // Get next question in sequence
      const nextQuestionCode = await getNextQuestion(question_code);

      if (!nextQuestionCode) {
        // No more questions - complete
        nextStepType = 'COMPLETE';
        nextStepCode = null;
      } else {
        nextStepCode = nextQuestionCode;
      }
    }

    // Step 5: Update flow state
    await updateFlowState(user_id, session_id, nextStepType, nextStepCode);

    console.log('='.repeat(60));
    console.log('✅ Answer processed successfully');
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      next_step_type: nextStepType,
      next_step_id: nextStepCode,
      scores,
      flags
    });
  } catch (error) {
    console.error('Error in /answer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /kai/lesson/:kai_lesson_id
 * Get KAI lesson content
 */
app.get('/kai/lesson/:kai_lesson_id', async (req, res) => {
  try {
    const { kai_lesson_id } = req.params;

    const lesson = await getKaiLessonContent(kai_lesson_id);

    // Parse content_data JSON if needed
    const parsedLesson = {
      ...lesson,
      content: lesson.content.map(item => ({
        ...item,
        content_data: typeof item.content_data === 'string'
          ? JSON.parse(item.content_data)
          : item.content_data
      }))
    };

    res.json({
      success: true,
      lesson: parsedLesson
    });
  } catch (error) {
    console.error('Error in /kai/lesson/:kai_lesson_id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /kai/lesson/complete
 * Mark KAI lesson as completed and trigger rescoring
 */
app.post('/kai/lesson/complete', async (req, res) => {
  try {
    const { user_id, session_id, kai_lesson_id } = req.body;

    if (!user_id || !session_id || !kai_lesson_id) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, session_id, kai_lesson_id'
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎓 Processing KAI lesson completion');
    console.log('='.repeat(60));

    // Complete KAI lesson and apply score boost
    const updatedScores = await completeKaiLesson(user_id, session_id, kai_lesson_id);

    // Re-evaluate branching with updated scores
    const branchingResult = await evaluateBranching(user_id, session_id, updatedScores, null);

    let nextStepType = branchingResult.stepType;
    let nextStepCode = branchingResult.stepCode;

    // Handle next step
    if (nextStepType === 'QUESTION' && nextStepCode === 'next') {
      // Get current question from flow
      const { data: userFlow } = await supabase
        .schema('journey_engine_schema')
        .from('user_flows')
        .select('current_step_code')
        .eq('user_id', user_id)
        .single();

      if (userFlow && userFlow.current_step_code) {
        const nextQuestionCode = await getNextQuestion(userFlow.current_step_code);

        if (!nextQuestionCode) {
          nextStepType = 'COMPLETE';
          nextStepCode = null;
        } else {
          nextStepCode = nextQuestionCode;
        }
      }
    }

    // Update flow state
    await updateFlowState(user_id, session_id, nextStepType, nextStepCode);

    console.log('='.repeat(60));
    console.log('✅ KAI lesson completed successfully');
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      next_step_type: nextStepType,
      next_step_id: nextStepCode,
      updated_scores: updatedScores
    });
  } catch (error) {
    console.error('Error in /kai/lesson/complete:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /scores
 * Get user score summary (optional)
 */
app.get('/scores', async (req, res) => {
  try {
    const { user_id, session_id } = req.query;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'Missing user_id or session_id' });
    }

    // Get current scores
    const { data: scores, error: scoresError } = await supabase
      .schema('insight_engine_schema')
      .from('scores')
      .select('score_code, score_value, max_value')
      .eq('user_id', user_id)
      .eq('session_id', session_id);

    if (scoresError) {
      throw new Error(`Failed to fetch scores: ${scoresError.message}`);
    }

    // Get score definitions for labels
    const { data: definitions, error: defsError } = await supabase
      .schema('question_master_schema')
      .from('score_definitions')
      .select('*');

    if (defsError) {
      throw new Error(`Failed to fetch score definitions: ${defsError.message}`);
    }

    // Merge scores with definitions
    const scoreDetails = scores.map(score => {
      const def = definitions.find(d => d.score_code === score.score_code);

      let interpretation = 'Unknown';
      if (def) {
        if (score.score_value < def.threshold_low) {
          interpretation = def.interpretation_low;
        } else if (score.score_value < def.threshold_medium) {
          interpretation = def.interpretation_medium;
        } else {
          interpretation = def.interpretation_high;
        }
      }

      return {
        score_code: score.score_code,
        score_name: def?.score_name || score.score_code,
        score_value: score.score_value,
        max_value: score.max_value,
        interpretation
      };
    });

    res.json({
      success: true,
      scores: scoreDetails
    });
  } catch (error) {
    console.error('Error in /scores:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /readiness
 * Get final readiness result (optional)
 */
app.get('/readiness', async (req, res) => {
  try {
    const { user_id, session_id } = req.query;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'Missing user_id or session_id' });
    }

    // Get relationship_readiness score
    const { data: readinessScore, error } = await supabase
      .schema('insight_engine_schema')
      .from('scores')
      .select('score_value')
      .eq('user_id', user_id)
      .eq('session_id', session_id)
      .eq('score_code', 'relationship_readiness')
      .single();

    if (error) {
      throw new Error(`Failed to fetch readiness score: ${error.message}`);
    }

    const value = readinessScore?.score_value || 0;

    let level, message, timeline;

    if (value < 40) {
      level = 'NOT READY';
      message = 'Focus on personal growth and emotional development before dating';
      timeline = '6-12 months of personal development recommended';
    } else if (value < 65) {
      level = 'BUILDING';
      message = 'You\'re making progress! Continue developing your relationship skills';
      timeline = '3-6 months of continued growth';
    } else if (value < 85) {
      level = 'READY';
      message = 'You\'re ready to explore healthy relationships';
      timeline = 'Ready to begin dating mindfully';
    } else {
      level = 'THRIVING';
      message = 'You have strong relationship readiness and emotional awareness';
      timeline = 'Ready for meaningful connections';
    }

    res.json({
      success: true,
      readiness_score: value,
      readiness_level: level,
      message,
      recommended_timeline: timeline
    });
  } catch (error) {
    console.error('Error in /readiness:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Wouch MVP Backend Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Connected to Supabase`);
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /onboarding/state?user_id=X&session_id=Y');
  console.log('   GET  /question/:question_code');
  console.log('   POST /answer');
  console.log('   GET  /kai/lesson/:kai_lesson_id');
  console.log('   POST /kai/lesson/complete');
  console.log('   GET  /scores?user_id=X&session_id=Y');
  console.log('   GET  /readiness?user_id=X&session_id=Y');
  console.log('='.repeat(60) + '\n');
});
