import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";

const categories = ["Food", "Housing", "Transport", "Entertainment", "Shopping", "Bills", "Healthcare", "Education", "Other"];

function BudgetForm({ onSubmit }) {
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (Number(limit) <= 0) return;
    onSubmit({ category, limit: Number(limit) });
    setLimit("");
  };

  return (
    <form onSubmit={submit} className="form-card card">
      <h2 style={{ marginTop: 0 }}>Create Monthly Budget</h2>

      <div className="form-grid">
        <Select
          label="Category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories}
        />

        <Input
          label="Budget Limit"
          name="limit"
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="5000"
          required
        />
      </div>

      <div className="form-actions">
        <Button type="submit">Create Budget</Button>
      </div>
    </form>
  );
}

export default BudgetForm;