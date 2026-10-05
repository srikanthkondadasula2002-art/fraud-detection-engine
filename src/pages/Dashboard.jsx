import SummaryCard from "../components/dashboard/SummaryCard";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import BudgetOverview from "../components/dashboard/BudgetOverview";
import QuickActions from "../components/dashboard/QuickActions";
import ExpenseChart from "../components/charts/ExpenseChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";

function Dashboard({ transactions, budgets, totals, onNavigate, streamState }) {
  return (
    <section className="page">
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Financial Overview</h1>
          <p>Track your money, understand your spending, and reach your goals.</p>
        </div>
        <QuickActions onAdd={() => onNavigate("transactions")} />
      </div>

      {streamState && (
        <div className="dashboard-fraud-banner" onClick={() => onNavigate("fraud")}>
          <div className="fraud-banner-left">
            <div className={`radar-pulse-dot ${streamState.running ? "pulse-active" : "pulse-idle"}`} />
            <div>
              <strong>Isolation Forest Streaming Fraud Radar</strong>
              <div style={{ fontSize: 13, color: "#687386" }}>
                {streamState.running
                  ? `Active stream (${streamState.stats.totalSeen} streamed, ${streamState.stats.highRisk} anomalies flagged) • Real-time scoring`
                  : "Simulate live streaming transactions with real-time Isolation Forest anomaly detection"}
              </div>
            </div>
          </div>
          <span className="stream-badge-link">
            {streamState.running ? "View Live Radar →" : "Launch Stream Radar →"}
          </span>
        </div>
      )}

      <div className="summary-grid">
        <SummaryCard title="Total Balance" amount={totals.balance} change="Current available balance" type="balance" />
        <SummaryCard title="Total Income" amount={totals.income} change="Money received" type="income" />
        <SummaryCard title="Total Expenses" amount={totals.expenses} change="Money spent" type="expense" />
        <SummaryCard title="Savings" amount={totals.balance} change={`${totals.savingsRate.toFixed(1)}% savings rate`} type="savings" />
      </div>

      <div className="dashboard-grid">
        <ExpenseChart transactions={transactions} />
        <IncomeExpenseChart transactions={transactions} />
      </div>

      <div className="dashboard-grid">
        <RecentTransactions transactions={transactions} />
        <BudgetOverview budgets={budgets} transactions={transactions} />
      </div>
    </section>
  );
}

export default Dashboard;