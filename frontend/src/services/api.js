const API_BASE_URL = 'http://localhost:3000';

/**
 * API Client for Wouch MVP Backend
 */

export const api = {
    /**
     * Get current onboarding state
     */
    async getOnboardingState(userId, sessionId) {
        const response = await fetch(
            `${API_BASE_URL}/onboarding/state?user_id=${userId}&session_id=${sessionId}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch onboarding state');
        }

        return response.json();
    },

    /**
     * Get question details
     */
    async getQuestion(questionCode) {
        const response = await fetch(`${API_BASE_URL}/question/${questionCode}`);

        if (!response.ok) {
            throw new Error('Failed to fetch question');
        }

        return response.json();
    },

    /**
     * Submit an answer
     */
    async submitAnswer(userId, sessionId, questionCode, responseValue) {
        const response = await fetch(`${API_BASE_URL}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId,
                question_code: questionCode,
                response_value: responseValue
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to submit answer';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Ignore JSON parse error if response is not JSON
            }
            console.error('Submit Answer Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Get KAI lesson content
     */
    async getKaiLesson(kaiLessonId) {
        const response = await fetch(`${API_BASE_URL}/kai/lesson/${kaiLessonId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch KAI lesson');
        }

        return response.json();
    },

    /**
     * Complete KAI lesson
     */
    async completeKaiLesson(userId, sessionId, kaiLessonId) {
        const response = await fetch(`${API_BASE_URL}/kai/lesson/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId,
                kai_lesson_id: kaiLessonId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to complete KAI lesson');
        }

        return response.json();
    },

    /**
     * Get user scores
     */
    async getScores(userId, sessionId) {
        const response = await fetch(
            `${API_BASE_URL}/scores?user_id=${userId}&session_id=${sessionId}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch scores');
        }

        return response.json();
    },

    /**
     * Get readiness result
     */
    async getReadiness(userId, sessionId) {
        const response = await fetch(
            `${API_BASE_URL}/readiness?user_id=${userId}&session_id=${sessionId}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch readiness');
        }

        return response.json();
    }
};

export default api;
