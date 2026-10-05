function BudgetOverview({ budgets, transactions }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Budget Overview</h2>
      </div>

      <div className="card-body">
        {budgets.length === 0 ? (
          <div className="empty">No budgets created.</div>
        ) : (
          budgets.map((budget) => {
            const spent = transactions
              .filter((t) => t.type === "expense" && t.category === budget.category)
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const percentage = budget.limit ? (spent / budget.limit) * 100 : 0;
            const width = Math.min(percentage, 100);
            const status = percentage >= 100 ? "danger" : percentage >= 80 ? "warning" : "";

            return (
              <div className="progress-row" key={budget.id}>
                <div className="progress-title">
                  <span>{budget.category}</span>
                  <span>₹{spent.toLocaleString("en-IN")} / ₹{Number(budget.limit).toLocaleString("en-IN")}</span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${status}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default BudgetOverview;