export default function OptionCard({ option, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`option-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="option-icon">
        {/* temporary placeholder icon */}
        <div className="icon-circle" />
      </div>

      <div className="option-text">
        {option.text}
      </div>
    </button>
  );
}
