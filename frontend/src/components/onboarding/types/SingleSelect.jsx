export default function SingleSelect({ options, value, onChange }) {
  return (
    <div className="options-container">
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`option-card ${value === opt.id ? "selected" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
