function TransactionSearch({ value, onChange }) {
  return (
    <input
      className="input search-box"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search transactions..."
    />
  );
}

export default TransactionSearch;