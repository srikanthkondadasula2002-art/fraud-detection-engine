import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

function SummaryCard({ title, amount, change, type }) {
  const positive = type === "income" || type === "savings";

  return (
    <div className="card summary-card">
      <div className="summary-top">
        <span className="summary-label">{title}</span>
        <div className="summary-icon">
          {type === "balance" ? <Wallet size={19} /> : positive ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}
        </div>
      </div>

      <div className="summary-value">
        ₹{amount.toLocaleString("en-IN")}
      </div>

      <div className="summary-change">
        {change}
      </div>
    </div>
  );
}

export default SummaryCard;