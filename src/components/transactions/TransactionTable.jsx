import { useState } from "react";
import { Info, Pencil, ShieldAlert, ShieldCheck, Trash2, X } from "lucide-react";
import EmptyState from "../common/EmptyState";
import Button from "../common/Button";

/**
 * Renders a color-coded fraud risk badge.
 */
function FraudBadge({ fraud }) {
  if (fraud === undefined) return null;

  if (fraud === null) {
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

/**
 * Renders an Anomaly Score visual progress bar with numeric percent.
 */
function AnomalyScoreCell({ fraud, onInspect }) {
  if (!fraud) {
    return <span style={{ color: "#94a3b8", fontSize: 13 }}>Pending…</span>;
  }

  const pct = Math.round((fraud.score || 0) * 100);
  const riskLevel = fraud.risk?.level || "low";

  return (
    <div
      className="anomaly-score-cell"
      onClick={onInspect}
      title="Click to inspect anomaly score telemetry"
    >
      <div className="anomaly-score-track">
        <div
          className={`anomaly-score-fill fill-${riskLevel}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={`anomaly-score-text text-${riskLevel}`}>
        {pct}%
      </span>
      <Info size={13} className="info-icon" />
    </div>
  );
}

function TransactionTable({ transactions, onEdit, onDelete }) {
  const [inspectingTx, setInspectingTx] = useState(null);

  if (!transactions.length) {
    return <EmptyState message="No transactions match your search." />;
  }

  const hasFraud = "fraud" in (transactions[0] || {});

  return (
    <>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              {hasFraud && <th>Anomaly Score</th>}
              {hasFraud && <th>Risk Level</th>}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td><strong>{transaction.description}</strong></td>
                <td><span className="category-tag">{transaction.category}</span></td>
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
                    <AnomalyScoreCell
                      fraud={transaction.fraud}
                      onInspect={() => setInspectingTx(transaction)}
                    />
                  </td>
                )}
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

      {/* ── Detailed Anomaly Score Breakdown Modal ── */}
      {inspectingTx && inspectingTx.fraud && (
        <div className="modal-backdrop" onClick={() => setInspectingTx(null)}>
          <div className="modal stream-inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {inspectingTx.fraud.risk.level === "high" ? (
                  <ShieldAlert size={22} color="#dc2626" />
                ) : (
                  <ShieldCheck size={22} color="#16a34a" />
                )}
                <h2>Anomaly Score Telemetry Report</h2>
              </div>
              <button className="close-button" onClick={() => setInspectingTx(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="inspect-header-block">
                <div>
                  <h3 style={{ margin: 0 }}>{inspectingTx.description}</h3>
                  <div style={{ color: "#687386", fontSize: 13, marginTop: 4 }}>
                    Category: <strong>{inspectingTx.category}</strong> • Amount: <strong>₹{Number(inspectingTx.amount).toLocaleString("en-IN")}</strong> • Date: <strong>{inspectingTx.date}</strong>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className={`score-badge-pill pill-${inspectingTx.fraud.risk.level}`}>
                    {Math.round(inspectingTx.fraud.score * 100)}% Anomaly Score
                  </div>
                  <div style={{ fontSize: 12, color: "#687386", marginTop: 4 }}>
                    {inspectingTx.fraud.risk.label}
                  </div>
                </div>
              </div>

              {/* Explanatory overview */}
              <div className="anomaly-explanation-card">
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13, color: "#1e293b" }}>
                  Isolation Forest Inference Summary
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                  {inspectingTx.fraud.explanation}
                </p>
                <div className="decision-banner" style={{ marginTop: 10 }}>
                  <strong>Model Recommendation:</strong> {inspectingTx.fraud.decisionAction || inspectingTx.fraud.decision}
                </div>
              </div>

              {/* Isolation Tree Path Metrics */}
              {inspectingTx.fraud.pathMetrics && (
                <div className="inspect-features-grid" style={{ marginTop: 16 }}>
                  <div className="feature-tile">
                    <span className="tile-title">Avg Path Length E[h(x)]</span>
                    <span className="tile-value">{inspectingTx.fraud.pathMetrics.avgPathLength} edges</span>
                    <span className="tile-desc">
                      {inspectingTx.fraud.pathMetrics.avgPathLength < inspectingTx.fraud.pathMetrics.cFactor
                        ? "⚠️ Isolated rapidly near root"
                        : "Deep tree traversal (benign)"}
                    </span>
                  </div>

                  <div className="feature-tile">
                    <span className="tile-title">Expected Path c(n)</span>
                    <span className="tile-value">{inspectingTx.fraud.pathMetrics.cFactor}</span>
                    <span className="tile-desc">Average for unsuccessful BST search</span>
                  </div>

                  <div className="feature-tile">
                    <span className="tile-title">Path Range [Min - Max]</span>
                    <span className="tile-value">
                      {inspectingTx.fraud.pathMetrics.minPathLength} - {inspectingTx.fraud.pathMetrics.maxPathLength}
                    </span>
                    <span className="tile-desc">Across 50 isolation trees</span>
                  </div>

                  <div className="feature-tile">
                    <span className="tile-title">Forest Consensus</span>
                    <span className="tile-value">
                      {Math.round((inspectingTx.fraud.pathMetrics.confidence || 0.85) * 100)}%
                    </span>
                    <span className="tile-desc">Low variance across trees</span>
                  </div>
                </div>
              )}

              {/* Contributing Risk Factors */}
              {inspectingTx.fraud.contributingFactors && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>
                    Explainable AI — Feature Attribution Breakdown
                  </h4>
                  <div className="attribution-list">
                    {inspectingTx.fraud.contributingFactors.map((factor, idx) => (
                      <div key={idx} className="attribution-row">
                        <div className="attribution-info">
                          <span className="attribution-name">{factor.name}</span>
                          <span className="attribution-desc">{factor.description}</span>
                        </div>
                        <div className="attribution-meter">
                          <div className="attribution-meter-track">
                            <div
                              className={`attribution-meter-fill fill-${factor.severity}`}
                              style={{ width: `${factor.percentage}%` }}
                            />
                          </div>
                          <span className="attribution-pct">{factor.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: "right" }}>
                <Button onClick={() => setInspectingTx(null)}>Close Telemetry</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TransactionTable;