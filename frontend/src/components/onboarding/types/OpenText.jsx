export default function OpenText({ value, min, max, onChange }) {
  return (
    <textarea
      value={value}
      minLength={min}
      maxLength={max}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", minHeight: 120 }}
    />
  );
}
