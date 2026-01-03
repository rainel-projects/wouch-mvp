import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './CompletionScreen.css';

/**
 * Completion Screen Component
 * Shows final readiness results
 */
function CompletionScreen({ userId, sessionId }) {
    const [readiness, setReadiness] = useState(null);
    const [scores, setScores] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const [readinessResponse, scoresResponse] = await Promise.all([
                    api.getReadiness(userId, sessionId),
                    api.getScores(userId, sessionId)
                ]);

                setReadiness(readinessResponse);
                setScores(scoresResponse.scores);
            } catch (err) {
                console.error('Error fetching results:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [userId, sessionId]);

    if (loading) {
        return (
            <div className="completion-screen loading">
                <div className="spinner"></div>
                <p>Calculating your results...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="completion-screen error">
                <h2>Error loading results</h2>
                <p>{error}</p>
            </div>
        );
    }

    const getReadinessColor = (level) => {
        switch (level) {
            case 'NOT READY': return '#e74c3c';
            case 'BUILDING': return '#f39c12';
            case 'READY': return '#27ae60';
            case 'THRIVING': return '#2ecc71';
            default: return '#95a5a6';
        }
    };

    return (
        <div className="completion-screen">
            <div className="completion-header">
                <h1>🎉 Assessment Complete!</h1>
                <p>Here's your dating readiness profile</p>
            </div>

            <div className="readiness-card">
                <div
                    className="readiness-badge"
                    style={{ backgroundColor: getReadinessColor(readiness.readiness_level) }}
                >
                    {readiness.readiness_level}
                </div>

                <div className="readiness-score">
                    <div className="score-circle">
                        <svg viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#e0e0e0"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={getReadinessColor(readiness.readiness_level)}
                                strokeWidth="8"
                                strokeDasharray={`${readiness.readiness_score * 2.827} 282.7`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="score-value">{readiness.readiness_score}</div>
                    </div>
                </div>

                <p className="readiness-message">{readiness.message}</p>
                <p className="readiness-timeline">
                    <strong>Timeline:</strong> {readiness.recommended_timeline}
                </p>
            </div>

            <div className="scores-breakdown">
                <h2>Your Scores</h2>
                <div className="scores-grid">
                    {scores && scores.map((score) => (
                        <div key={score.score_code} className="score-item">
                            <div className="score-header">
                                <h3>{score.score_name}</h3>
                                <span className="score-number">{score.score_value}/{score.max_value}</span>
                            </div>
                            <div className="score-bar">
                                <div
                                    className="score-fill"
                                    style={{ width: `${(score.score_value / score.max_value) * 100}%` }}
                                ></div>
                            </div>
                            <p className="score-interpretation">{score.interpretation}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="next-steps">
                <h2>What's Next?</h2>
                <p>Based on your results, we recommend focusing on personal growth before diving into dating. Check back in a few months to reassess your readiness.</p>
                <button className="restart-button" onClick={() => window.location.reload()}>
                    Start New Assessment
                </button>
            </div>
        </div>
    );
}

export default CompletionScreen;
