function Input({ label, name, value, onChange, type = "text", placeholder, required = false }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <input
        className="input"
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

export default Input;