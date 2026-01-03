export default function QuestionHeader({ step, question }) {
  return (
    <div className="question-header">
      <div className="step-indicator">{step}</div>
      <h1>{question}</h1>
    </div>
  );
}
