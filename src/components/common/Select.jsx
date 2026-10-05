function Select({ label, name, value, onChange, options }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <select className="select" name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Select;