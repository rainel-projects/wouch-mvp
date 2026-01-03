export default function ActionFooter({ disabled, onContinue }) {
  return (
    <div className="action-footer">
      <button className="skip-btn" type="button">
        Skip
      </button>

      <button
        className="primary-btn"
        type="button"
        disabled={disabled}
        onClick={onContinue}
      >
        Continue
      </button>
    </div>
  );
}
