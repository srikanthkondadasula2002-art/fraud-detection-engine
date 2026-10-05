import { useMemo } from "react";
import BudgetForm from "../components/budgets/BudgetForm";
import BudgetCard from "../components/budgets/BudgetCard";

function Budgets({ budgets, transactions, onAdd, onDelete }) {
  const spentByCategory = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((map, t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
        return map;
      }, {});
  }, [transactions]);

  return (
    <section className="page">
      <div className="page-heading">
        <h1>Budgets</h1>
        <p>Set spending limits and monitor your progress.</p>
      </div>

      <div style={{ marginBottom: 22 }}>
        <BudgetForm onSubmit={onAdd} />
      </div>

      <div className="budget-grid">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            spent={spentByCategory[budget.category] || 0}
            onDelete={(id) => {
              if (window.confirm("Delete this budget?")) onDelete(id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default Budgets;