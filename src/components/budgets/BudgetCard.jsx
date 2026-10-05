import { Trash2 } from "lucide-react";

function BudgetCard({ budget, spent, onDelete }) {
  const percentage = budget.limit ? (spent / budget.limit) * 100 : 0;
  const width = Math.min(percentage, 100);
  const status = percentage >= 100 ? "danger" : percentage >= 80 ? "warning" : "";

  return (
    <div className="budget-card card">
      <div className="budget-top">
        <div>
          <div className="budget-category">{budget.category}</div>
          <div className="budget-amount">
            ₹{spent.toLocaleString("en-IN")} / ₹{Number(budget.limit).toLocaleString("en-IN")}
          </div>
        </div>

        <button className="icon-button" onClick={() => onDelete(budget.id)} aria-label="Delete budget">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="progress-track">
        <div className={`progress-fill ${status}`} style={{ width: `${width}%` }} />
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: percentage > 100 ? "#dc2626" : "#687386" }}>
        {Math.round(percentage)}% used
        {percentage > 100 ? " — budget exceeded" : ""}
      </div>
    </div>
  );
}

export default BudgetCard;