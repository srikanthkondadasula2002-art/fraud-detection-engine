import { useMemo } from "react";
import ExpenseChart from "../components/charts/ExpenseChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import CategoryChart from "../components/charts/CategoryChart";
import SavingsChart from "../components/charts/SavingsChart";
import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";

function Analytics({ transactions }) {
  // Anomaly score analytics
  const anomalyStats = useMemo(() => {
    const scored = transactions.filter((t) => t.fraud && t.fraud.score != null);
    if (!scored.length) return null;

    const scores = scored.map((t) => t.fraud.score);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
    const maxScore = Math.max(...scores) * 100;

    const highCount = scored.filter((t) => t.fraud.risk?.level === "high").length;
    const medCount = scored.filter((t) => t.fraud.risk?.level === "medium").length;
    const lowCount = scored.filter((t) => t.fraud.risk?.level === "low").length;

    // By category
    const catMap = {};
    scored.forEach((t) => {
      const cat = t.category || "Other";
      if (!catMap[cat]) catMap[cat] = { total: 0, sumScore: 0 };
      catMap[cat].total += 1;
      catMap[cat].sumScore += t.fraud.score;
    });

    const categoryAverages = Object.entries(catMap)
      .map(([name, data]) => ({
        name,
        avgPct: Math.round((data.sumScore / data.total) * 100),
        count: data.total,
      }))
      .sort((a, b) => b.avgPct - a.avgPct);

    return {
      totalScored: scored.length,
      avgScore: avgScore.toFixed(1),
      maxScore: maxScore.toFixed(1),
      highCount,
      medCount,
      lowCount,
      categoryAverages,
    };
  }, [transactions]);

  return (
    <section className="page">
      <div className="page-heading">
        <h1>Financial &amp; Anomaly Analytics</h1>
        <p>Understand your income, expenses, category distribution, and Isolation Forest anomaly score patterns.</p>
      </div>

      {anomalyStats && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={20} color="#2563eb" />
              <h2 style={{ margin: 0, fontSize: 17 }}>Isolation Forest Anomaly Score Intelligence</h2>
            </div>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {anomalyStats.totalScored} ledger transactions evaluated
            </span>
          </div>

          <div className="analytics-fraud-summary-grid">
            <div className="fraud-summary-stat-box">
              <span className="stat-label">Average Anomaly Score</span>
              <span className="stat-value">{anomalyStats.avgScore}%</span>
              <span className="stat-desc">Baseline cluster norm</span>
            </div>
            <div className="fraud-summary-stat-box">
              <span className="stat-label">Peak Anomaly Score</span>
              <span className="stat-value" style={{ color: "#dc2626" }}>{anomalyStats.maxScore}%</span>
              <span className="stat-desc">Highest detected outlier</span>
            </div>
            <div className="fraud-summary-stat-box">
              <span className="stat-label">High Risk Anomalies</span>
              <span className="stat-value" style={{ color: "#dc2626" }}>{anomalyStats.highCount}</span>
              <span className="stat-desc">Score &ge; 62%</span>
            </div>
            <div className="fraud-summary-stat-box">
              <span className="stat-label">Normal / Approved</span>
              <span className="stat-value" style={{ color: "#16a34a" }}>{anomalyStats.lowCount}</span>
              <span className="stat-desc">Score &lt; 50%</span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, margin: "0 0 12px 0", color: "#334155" }}>
              Average Anomaly Score by Category
            </h3>
            <div className="category-anomaly-bar-list">
              {anomalyStats.categoryAverages.map((cat) => (
                <div key={cat.name} className="cat-anomaly-row">
                  <span className="cat-name">{cat.name}</span>
                  <div className="cat-track">
                    <div
                      className={`cat-fill ${cat.avgPct >= 62 ? "fill-high" : cat.avgPct >= 50 ? "fill-medium" : "fill-low"}`}
                      style={{ width: `${Math.min(100, cat.avgPct)}%` }}
                    />
                  </div>
                  <span className="cat-score">{cat.avgPct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        <ExpenseChart transactions={transactions} />
        <IncomeExpenseChart transactions={transactions} />
        <CategoryChart transactions={transactions} />
        <SavingsChart transactions={transactions} />
      </div>
    </section>
  );
}

export default Analytics;