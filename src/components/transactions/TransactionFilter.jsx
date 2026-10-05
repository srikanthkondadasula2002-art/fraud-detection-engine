function TransactionFilter({ type, category, onTypeChange, onCategoryChange }) {
  const categories = ["All", "Food", "Housing", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Education", "Salary", "Freelance", "Business", "Investment", "Other"];

  return (
    <>
      <select className="select" value={type} onChange={(e) => onTypeChange(e.target.value)}>
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      <select className="select" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        {categories.map((item) => (
          <option key={item} value={item === "All" ? "all" : item}>
            {item === "All" ? "All Categories" : item}
          </option>
        ))}
      </select>
    </>
  );
}

export default TransactionFilter;