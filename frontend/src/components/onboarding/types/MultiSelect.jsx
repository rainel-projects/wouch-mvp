export default function MultiSelect({ options, value, onChange }) {
  const toggle = (id) => {
    onChange(
      value.includes(id)
        ? value.filter(v => v !== id)
        : [...value, id]
    );
  };

  return (
    <div className="options-container">
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`option-card ${value.includes(opt.id) ? "selected" : ""}`}
          onClick={() => toggle(opt.id)}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
