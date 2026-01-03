import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './KaiLessonScreen.css';

/**
 * KAI Lesson Screen Component
 * Renders KAI intervention content
 */
function KaiLessonScreen({ kaiLessonId, onComplete, loading }) {
    const [lesson, setLesson] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                setFetchError(null);
                const response = await api.getKaiLesson(kaiLessonId);
                setLesson(response.lesson);
                setCurrentSlide(0);
            } catch (err) {
                console.error('Error fetching KAI lesson:', err);
                setFetchError(err.message);
            }
        };

        if (kaiLessonId) {
            fetchLesson();
        }
    }, [kaiLessonId]);

    const handleNext = () => {
        if (lesson && currentSlide < lesson.content.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handlePrevious = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleComplete = () => {
        onComplete(kaiLessonId);
    };

    if (fetchError) {
        return (
            <div className="kai-lesson-screen error">
                <h2>Error loading lesson</h2>
                <p>{fetchError}</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="kai-lesson-screen loading">
                <div className="spinner"></div>
                <p>Loading lesson...</p>
            </div>
        );
    }

    const isLastSlide = currentSlide === lesson.content.length - 1;
    const currentContent = lesson.content[currentSlide];

    return (
        <div className="kai-lesson-screen">
            <div className="kai-header">
                <div className="kai-badge">KAI Intervention</div>
                <h1 className="kai-title">{lesson.lesson_title}</h1>
                <p className="kai-goal">{lesson.lesson_goal}</p>
            </div>

            <div className="kai-content">
                {currentContent && (
                    <div className="content-slide">
                        {currentContent.content_data.heading && (
                            <h2>{currentContent.content_data.heading}</h2>
                        )}

                        {currentContent.content_data.body && (
                            <p className="content-body">{currentContent.content_data.body}</p>
                        )}

                        {currentContent.content_data.instructions && (
                            <div className="exercise-box">
                                <h3>Exercise</h3>
                                <p>{currentContent.content_data.instructions}</p>
                                {currentContent.content_data.action && (
                                    <div className="action-item">
                                        <strong>Action:</strong> {currentContent.content_data.action}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="kai-navigation">
                <div className="slide-indicators">
                    {lesson.content.map((_, index) => (
                        <span
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        ></span>
                    ))}
                </div>

                <div className="nav-buttons">
                    <button
                        onClick={handlePrevious}
                        disabled={currentSlide === 0}
                        className="nav-button prev"
                    >
                        Previous
                    </button>

                    {!isLastSlide ? (
                        <button
                            onClick={handleNext}
                            className="nav-button next"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="complete-button"
                        >
                            {loading ? 'Completing...' : 'Complete Lesson'}
                        </button>
                    )}
                </div>
            </div>

            <div className="kai-footer">
                <p className="duration-estimate">
                    ⏱️ Estimated time: {lesson.estimated_duration_minutes} minutes
                </p>
            </div>
        </div>
    );
}

export default KaiLessonScreen;
