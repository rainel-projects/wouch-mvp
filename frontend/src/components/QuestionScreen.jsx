import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './QuestionScreen.css';

/**
 * Question Screen Component
 * Renders a question and handles user input
 */
function QuestionScreen({ questionCode, onSubmit, loading }) {
    const [question, setQuestion] = useState(null);
    const [selectedValue, setSelectedValue] = useState('');
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setFetchError(null);
                const response = await api.getQuestion(questionCode);
                setQuestion(response.question);
                setSelectedValue(''); // Reset selection
            } catch (err) {
                console.error('Error fetching question:', err);
                setFetchError(err.message);
            }
        };

        if (questionCode) {
            fetchQuestion();
        }
    }, [questionCode]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedValue) {
            alert('Please select an answer');
            return;
        }

        onSubmit(questionCode, selectedValue);
    };

    if (fetchError) {
        return (
            <div className="question-screen error">
                <h2>Error loading question</h2>
                <p>{fetchError}</p>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="question-screen loading">
                <div className="spinner"></div>
                <p>Loading question...</p>
            </div>
        );
    }

    return (
        <div className="question-screen">
            <div className="question-content">
                <h2 className="question-text">{question.question_text}</h2>

                <form onSubmit={handleSubmit} className="question-form">
                    <div className="options-container">
                        {question.options && question.options.map((option, index) => (
                            <label
                                key={`${option.id}-${index}`}
                                className={`option-card ${selectedValue === option.value ? 'selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option.value}
                                    checked={selectedValue === option.value}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                />
                                <div className="option-content">
                                    <span className="option-text">{option.text}</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading || !selectedValue}
                    >
                        {loading ? 'Submitting...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default QuestionScreen;
