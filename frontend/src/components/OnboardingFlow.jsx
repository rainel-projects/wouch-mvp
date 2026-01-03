import React, { useState, useEffect } from 'react';
import api from '../services/api';
import QuestionScreen from './QuestionScreen';
import KaiLessonScreen from './KaiLessonScreen';
import CompletionScreen from './CompletionScreen';
import './OnboardingFlow.css';

/**
 * Main Onboarding Flow Container
 * Manages the overall onboarding state and renders appropriate screens
 */
function OnboardingFlow() {
    const [userId] = useState(() => {
        // Get or create user ID
        let id = localStorage.getItem('wouch_user_id');
        if (!id) {
            id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('wouch_user_id', id);
        }
        return id;
    });

    const [sessionId] = useState(() => {
        // Get or create session ID
        let id = localStorage.getItem('wouch_session_id');
        if (!id) {
            id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('wouch_session_id', id);
        }
        return id;
    });

    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch current onboarding state
    const fetchState = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getOnboardingState(userId, sessionId);
            setState(response);
        } catch (err) {
            console.error('Error fetching onboarding state:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchState();
    }, []);

    // Handle answer submission
    const handleAnswerSubmit = async (questionCode, responseValue) => {
        try {
            setLoading(true);
            const response = await api.submitAnswer(userId, sessionId, questionCode, responseValue);

            // Update state with next step
            setState({
                step_type: response.next_step_type,
                step_id: response.next_step_id,
                progress: state.progress
            });
        } catch (err) {
            console.error('Error submitting answer:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle KAI lesson completion
    const handleKaiComplete = async (kaiLessonId) => {
        try {
            setLoading(true);
            const response = await api.completeKaiLesson(userId, sessionId, kaiLessonId);

            // Update state with next step
            setState({
                step_type: response.next_step_type,
                step_id: response.next_step_id,
                progress: state.progress
            });
        } catch (err) {
            console.error('Error completing KAI lesson:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Render loading state
    if (loading && !state) {
        return (
            <div className="onboarding-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your onboarding journey...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && !state) {
        return (
            <div className="onboarding-container">
                <div className="error-state">
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={fetchState}>Try Again</button>
                </div>
            </div>
        );
    }

    // Render appropriate screen based on step_type
    return (
        <div className="onboarding-container">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${state?.progress || 0}%` }}
                ></div>
            </div>

            {state?.step_type === 'QUESTION' && (
                <QuestionScreen
                    questionCode={state.step_id}
                    onSubmit={handleAnswerSubmit}
                    loading={loading}
                />
            )}

            {state?.step_type === 'KAI' && (
                <KaiLessonScreen
                    kaiLessonId={state.step_id}
                    onComplete={handleKaiComplete}
                    loading={loading}
                />
            )}

            {state?.step_type === 'COMPLETE' && (
                <CompletionScreen
                    userId={userId}
                    sessionId={sessionId}
                />
            )}
        </div>
    );
}

export default OnboardingFlow;
