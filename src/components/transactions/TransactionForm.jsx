import { useEffect, useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";

const expenseCategories = ["Food", "Housing", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Education", "Other"];
const incomeCategories = ["Salary", "Freelance", "Business", "Investment", "Other"];

function TransactionForm({ initialTransaction, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    description: "",
    category: "Food",
    type: "expense",
    amount: "",
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (initialTransaction) {
      setForm(initialTransaction);
    }
  }, [initialTransaction]);

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "type"
        ? { category: value === "income" ? "Salary" : "Food" }
        : {})
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.description.trim() || Number(form.amount) <= 0) return;

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="e.g. Grocery Shopping"
          required
        />

        <Input
          label="Amount"
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
          placeholder="3500"
          required
        />

        <Select
          label="Type"
          name="type"
          value={form.type}
          onChange={handleChange}
          options={["expense", "income"]}
        />

        <Select
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
          options={categories}
        />

        <Input
          label="Date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialTransaction ? "Update Transaction" : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm;