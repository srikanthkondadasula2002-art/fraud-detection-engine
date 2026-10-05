import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import EmptyState from "../common/EmptyState";

function RecentTransactions({ transactions }) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Recent Transactions</h2>
      </div>

      {recent.length === 0 ? (
        <EmptyState message="No transactions yet." />
      ) : (
        <div className="transaction-list">
          {recent.map((transaction) => (
            <div className="transaction-item" key={transaction.id}>
              <div className="transaction-info">
                <div className="transaction-icon">
                  {transaction.type === "income" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <div className="transaction-name">{transaction.description}</div>
                  <div className="transaction-meta">
                    {transaction.category} • {transaction.date}
                  </div>
                </div>
              </div>

              <div className={transaction.type === "income" ? "amount-income" : "amount-expense"}>
                {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentTransactions;