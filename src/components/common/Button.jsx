function Button({ children, onClick, type = "button", variant = "primary", icon }) {
  return (
    <button type={type} onClick={onClick} className={`button button-${variant}`}>
      {icon}
      {children}
    </button>
  );
}

export default Button;