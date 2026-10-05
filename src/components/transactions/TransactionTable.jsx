import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../common/EmptyState";

/**
 * Renders a color-coded fraud risk badge.
 * `fraud` is the object returned by `scoreTransaction`:
 *   { score: number, risk: { level, label, color } }
 */
function FraudBadge({ fraud }) {
  if (fraud === undefined) return null; // column not wired yet

  if (fraud === null) {
    // Model still loading
    return (
      <span className="badge badge-fraud-loading" title="Fraud model loading…">
        Scoring…
      </span>
    );
  }

  const { score, risk } = fraud;
  const pct = Math.round(score * 100);

  return (
    <span
      className={`badge badge-fraud badge-fraud-${risk.level}`}
      title={`Anomaly score: ${pct}%`}
      style={{ "--fraud-color": risk.color }}
    >
      {risk.label}
    </span>
  );
}

function TransactionTable({ transactions, onEdit, onDelete }) {
  if (!transactions.length) {
    return <EmptyState message="No transactions match your search." />;
  }

  // Determine if fraud scores are present (first transaction is a proxy)
  const hasFraud = "fraud" in (transactions[0] || {});

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>Amount</th>
            {hasFraud && <th>Fraud Risk</th>}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.date}</td>
              <td><strong>{transaction.description}</strong></td>
              <td>{transaction.category}</td>
              <td>
                <span className={`badge badge-${transaction.type}`}>
                  {transaction.type}
                </span>
              </td>
              <td className={transaction.type === "income" ? "amount-income" : "amount-expense"}>
                {transaction.type === "income" ? "+" : "-"}₹{Number(transaction.amount).toLocaleString("en-IN")}
              </td>
              {hasFraud && (
                <td>
                  <FraudBadge fraud={transaction.fraud} />
                </td>
              )}
              <td>
                <div className="actions">
                  <button className="icon-button" onClick={() => onEdit(transaction)} aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button className="icon-button" onClick={() => onDelete(transaction.id)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;