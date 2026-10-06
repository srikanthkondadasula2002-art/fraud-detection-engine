import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import Button from "../common/Button";
import { generateAnomalyScore } from "../../fraud/anomalyScorer";

function StreamMonitor({
  streamState,
  modelLoading,
  modelError,
  model,
}) {
  const {
    feed,
    alerts,
    running,
    stats,
    currentSpeed,
    syncWithLedger,
    setSyncWithLedger,
    start,
    pause,
    resume,
    stop,
    clearFeed,
    setSpeed,
    emitNow,
    dismissAlert,
  } = streamState;

  const [selectedTx, setSelectedTx] = useState(null);
  const [anomalyThreshold, setAnomalyThreshold] = useState(62); // 62% default threshold
  const [showSimulator, setShowSimulator] = useState(false);

  // ── Simulator Form State ──────────────────────────────────────────────────
  const [simDesc, setSimDesc] = useState("Dubai Luxury Watch Emporium");
  const [simCategory, setSimCategory] = useState("Shopping");
  const [simAmount, setSimAmount] = useState(185000);
  const [simHour, setSimHour] = useState(3);
  const [simWeekend, setSimWeekend] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const handleSimulate = (e) => {
    e?.preventDefault();
    if (!model) return;
    const tx = {
      description: simDesc,
      category: simCategory,
      type: "expense",
      amount: Number(simAmount),
      hour: Number(simHour),
      date: simWeekend ? "2026-10-04" : "2026-10-06",
      time: `${String(simHour).padStart(2, "0")}:30:00`,
    };
    const result = generateAnomalyScore(tx, model);
    setSimResult(result);
  };

  const fraudRate = stats.totalSeen > 0
    ? (((stats.highRisk + stats.mediumRisk) / stats.totalSeen) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="stream-monitor-container">
      {/* ── Model status bar ── */}
      {modelLoading && (
        <div className="stream-banner stream-banner-info">
          <Activity size={18} className="spin-icon" />
          <span>Loading Isolation Forest model parameters (50 isolation trees)...</span>
        </div>
      )}

      {modelError && (
        <div className="stream-banner stream-banner-error">
          <AlertTriangle size={18} />
          <span>Error loading fraud model: {modelError}</span>
        </div>
      )}

      {/* ── Active High-Risk Alert Toast Banner ── */}
      {alerts.length > 0 && (
        <div className="stream-alert-strip">
          <div className="stream-alert-header">
            <div className="stream-alert-title">
              <Flame size={20} className="flame-icon" />
              <span>
                <strong>{alerts.length} High/Medium Risk Event{alerts.length > 1 ? "s" : ""} Detected</strong> in live stream
              </span>
            </div>
            <button className="stream-text-button" onClick={() => dismissAlert(alerts[0].id)}>
              Dismiss Latest
            </button>
          </div>
          <div className="stream-alert-card">
            <div className="stream-alert-badge">
              <ShieldAlert size={16} />
              <span>{alerts[0].fraud?.risk?.label || "Anomaly"}</span>
            </div>
            <div className="stream-alert-info">
              <strong>{alerts[0].description}</strong>
              <span className="stream-alert-details">
                {alerts[0].category} • ₹{Number(alerts[0].amount).toLocaleString("en-IN")} • {alerts[0]._arrivedAt}
              </span>
            </div>
            <div className="stream-alert-score">
              <span className="score-label">Anomaly Score</span>
              <span className="score-val">
                {alerts[0].fraud ? Math.round(alerts[0].fraud.score * 100) : "--"}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Control Console Card ── */}
      <div className="card stream-control-card">
        <div className="stream-control-header">
          <div className="stream-radar-status">
            <div className={`radar-pulse-dot ${running ? "pulse-active" : "pulse-idle"}`} />
            <div>
              <div className="radar-title">
                {running ? "LIVE TRANSACTION STREAM ACTIVE" : "STREAM STANDBY"}
              </div>
              <div className="radar-subtitle">
                {running
                  ? `Emitting every ${currentSpeed / 1000}s • Evaluated via 50-tree Isolation Forest (${stats.lastLatencyMs}ms latency)`
                  : "Start the stream to simulate incoming transactions evaluated with continuous anomaly scoring"}
              </div>
            </div>
          </div>

          <div className="stream-action-buttons">
            {!running ? (
              <Button onClick={start} icon={<Play size={16} />} variant="primary">
                {feed.length > 0 ? "Resume Stream" : "Start Live Stream"}
              </Button>
            ) : (
              <Button onClick={pause} icon={<Pause size={16} />} variant="secondary">
                Pause Stream
              </Button>
            )}

            <button
              className="icon-button"
              onClick={stop}
              title="Stop stream & reset"
              aria-label="Stop stream"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className={`icon-button ${showSimulator ? "active" : ""}`}
              onClick={() => {
                setShowSimulator((prev) => !prev);
                if (!simResult && model) handleSimulate();
              }}
              title="Toggle Anomaly Score Simulator"
              style={{ background: showSimulator ? "#eff6ff" : "transparent", color: showSimulator ? "#2563eb" : "#475569" }}
            >
              <Calculator size={16} />
            </button>
          </div>
        </div>

        <div className="stream-control-divider" />

        <div className="stream-subcontrols">
          <div className="stream-speed-selector">
            <span className="subcontrol-label">Interval Speed:</span>
            {[
              { label: "1.0s (Fast)", ms: 1000 },
              { label: "2.5s (Normal)", ms: 2500 },
              { label: "5.0s (Slow)", ms: 5000 },
            ].map((option) => (
              <button
                key={option.ms}
                className={`speed-pill ${currentSpeed === option.ms ? "active" : ""}`}
                onClick={() => setSpeed(option.ms)}
              >
                <Clock size={12} style={{ marginRight: 4 }} />
                {option.label}
              </button>
            ))}
          </div>

          <div className="stream-interactive-triggers">
            <button
              className="trigger-button trigger-anomaly"
              onClick={() => emitNow(true)}
              title="Instantly generate and score an unusual transaction to test the Isolation Forest"
            >
              <Zap size={15} />
              <span>Inject Anomaly</span>
            </button>
            <button
              className="trigger-button trigger-normal"
              onClick={() => emitNow(false)}
              title="Instantly emit a typical everyday transaction"
            >
              <Sparkles size={15} />
              <span>Inject Normal</span>
            </button>
          </div>

          <label className="stream-sync-toggle">
            <input
              type="checkbox"
              checked={syncWithLedger}
              onChange={(e) => setSyncWithLedger(e.target.checked)}
            />
            <span>Auto-save to Transactions Ledger</span>
          </label>
        </div>

        {/* ── Anomaly Score Threshold Sensitivity Slider ── */}
        <div className="stream-threshold-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sliders size={14} color="#64748b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              Anomaly Decision Threshold:
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: anomalyThreshold >= 65 ? "#dc2626" : anomalyThreshold >= 50 ? "#d97706" : "#16a34a" }}>
              {anomalyThreshold}%
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              (Scores &ge; {anomalyThreshold}% trigger High Risk intervention)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 240px" }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>40%</span>
            <input
              type="range"
              min="40"
              max="85"
              step="1"
              value={anomalyThreshold}
              onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }}
            />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>85%</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Anomaly Score Simulator Widget ── */}
      {showSimulator && (
        <div className="card stream-simulator-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={18} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Commit 3: Interactive Anomaly Score Generator &amp; Telemetry Lab
              </h3>
            </div>
            <button
              className="stream-text-button"
              onClick={() => setShowSimulator(false)}
            >
              Close Simulator
            </button>
          </div>

          <form onSubmit={handleSimulate} className="simulator-form-grid">
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value)}
                placeholder="Merchant or description"
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                className="select"
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other / Wire / Crypto</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="input"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Time of Day (Hour: 0 - 23)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={simHour}
                  onChange={(e) => setSimHour(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#2563eb" }}
                />
                <span style={{ fontWeight: 700, minWidth: 45, fontSize: 13 }}>
                  {String(simHour).padStart(2, "0")}:00
                </span>
              </div>
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <label style={{ margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={simWeekend}
                  onChange={(e) => setSimWeekend(e.target.checked)}
                />
                Weekend Transaction
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <Button type="submit" variant="primary" icon={<Zap size={15} />}>
                Compute Anomaly Score
              </Button>
            </div>
          </form>

          {/* Simulator Output */}
          {simResult && (
            <div className="simulator-results-panel" style={{ marginTop: 20 }}>
              <div className="sim-result-header">
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Isolation Forest Evaluation
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: simResult.risk.color }}>
                    {simResult.scorePercent}% Anomaly Score
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                    Classification: <strong>{simResult.risk.label}</strong> • Action: <strong>{simResult.decision}</strong>
                  </div>
                </div>

                <div className="sim-path-metrics">
                  <div className="sim-path-stat">
                    <span className="stat-label">Avg Path Depth E[h(x)]</span>
                    <span className="stat-val">{simResult.pathMetrics.avgPathLength} edges</span>
                  </div>
                  <div className="sim-path-stat">
                    <span className="stat-label">c(n) Baseline</span>
                    <span className="stat-val">{simResult.pathMetrics.cFactor}</span>
                  </div>
                  <div className="sim-path-stat">
                    <span className="stat-label">Consensus</span>
                    <span className="stat-val">{Math.round((simResult.pathMetrics.confidence || 0.85) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="sim-explanation" style={{ margin: "14px 0", fontSize: 13, color: "#334155", background: "#f8fafc", padding: "10px 14px", borderRadius: 8 }}>
                <strong>Reasoning:</strong> {simResult.explanation}
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Feature Attribution Impact
                </div>
                <div className="attribution-list">
                  {simResult.contributingFactors.map((factor, idx) => (
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
            </div>
          )}
        </div>
      )}

      {/* ── Real-Time Metrics Grid ── */}
      <div className="stream-metrics-grid">
        <div className="stream-metric-card metric-total">
          <div className="metric-icon">
            <Activity size={22} />
          </div>
          <div>
            <div className="metric-label">Total Evaluated</div>
            <div className="metric-value">{stats.totalSeen}</div>
            <div className="metric-foot">
              Avg latency: {stats.avgLatencyMs || "< 1"}ms
            </div>
          </div>
        </div>

        <div className="stream-metric-card metric-danger">
          <div className="metric-icon">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="metric-label">High Risk Flagged</div>
            <div className="metric-value">{stats.highRisk}</div>
            <div className="metric-foot">Anomaly score &ge; {anomalyThreshold}%</div>
          </div>
        </div>

        <div className="stream-metric-card metric-warning">
          <div className="metric-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="metric-label">Medium Risk</div>
            <div className="metric-value">{stats.mediumRisk}</div>
            <div className="metric-foot">Score 50% - {anomalyThreshold - 1}%</div>
          </div>
        </div>

        <div className="stream-metric-card metric-safe">
          <div className="metric-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="metric-label">Low Risk / Normal</div>
            <div className="metric-value">{stats.lowRisk}</div>
            <div className="metric-foot">Anomaly rate: {fraudRate}%</div>
          </div>
        </div>
      </div>

      {/* ── Live Stream Feed Table ── */}
      <div className="card stream-table-card">
        <div className="stream-table-header">
          <div>
            <h3 style={{ margin: 0 }}>Live Transaction Feed</h3>
            <p style={{ margin: 0, color: "#687386", fontSize: 13 }}>
              Real-time anomaly scoring applied on arrival using the 50-tree Isolation Forest model.
            </p>
          </div>
          {feed.length > 0 && (
            <button className="stream-text-button" onClick={clearFeed}>
              Clear Buffer
            </button>
          )}
        </div>

        {feed.length === 0 ? (
          <div className="empty stream-empty-state">
            <Activity size={40} style={{ color: "#94a3b8", marginBottom: 12 }} />
            <h4>No Stream Transactions Yet</h4>
            <p>
              Click <strong>&quot;Start Live Stream&quot;</strong> or <strong>&quot;Inject Anomaly&quot;</strong> above to watch
              transactions stream in and get scored instantly.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button onClick={start} icon={<Play size={16} />}>
                Start Live Stream
              </Button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table stream-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Anomaly Score</th>
                  <th>Path Depth E[h]</th>
                  <th>Risk Tier</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((tx, idx) => {
                  const score = tx.fraud?.score ?? 0;
                  const pct = Math.round(score * 100);
                  const isHigh = pct >= anomalyThreshold;
                  const isMed = !isHigh && pct >= 50;
                  const riskLevel = isHigh ? "high" : isMed ? "medium" : "low";
                  const riskLabel = isHigh ? "High Risk" : isMed ? "Medium Risk" : "Low Risk";
                  const riskColor = isHigh ? "#dc2626" : isMed ? "#f59e0b" : "#16a34a";
                  const isNewest = idx === 0;

                  return (
                    <tr
                      key={tx.id}
                      className={`stream-row stream-row-${riskLevel} ${isNewest ? "stream-row-new" : ""}`}
                      onClick={() => setSelectedTx(tx)}
                      title="Click to view detailed Isolation Forest anomaly telemetry"
                    >
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="stream-time-tag">
                          {tx._arrivedAt || tx.time || tx.date}
                        </span>
                      </td>
                      <td>
                        <strong>{tx.description}</strong>
                        {tx._anomaly && (
                          <span className="anomaly-injected-pill" title="Injected anomalous pattern">
                            Synthetic Anomaly
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="category-tag">{tx.category}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                      </td>
                      <td className={tx.type === "income" ? "amount-income" : "amount-expense"} style={{ fontWeight: 700 }}>
                        {tx.type === "income" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <div className="stream-score-bar-wrapper">
                          <div className="stream-score-bar-track">
                            <div
                              className={`stream-score-bar-fill fill-${riskLevel}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="stream-score-text">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontFamily: "monospace", color: "#475569" }}>
                          {tx.fraud?.pathMetrics?.avgPathLength != null
                            ? `${tx.fraud.pathMetrics.avgPathLength} edges`
                            : "8.5 edges"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge badge-fraud badge-fraud-${riskLevel}`}
                          style={{ "--fraud-color": riskColor }}
                        >
                          {riskLabel}
                        </span>
                      </td>
                      <td>
                        <span className="latency-badge" title="Pure client-side tree traversal">
                          {tx._latencyMs != null ? `${tx._latencyMs}ms` : "< 1ms"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Transaction Diagnostics Modal ── */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="modal stream-inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Anomaly Score Inspection</h2>
              <button className="close-button" onClick={() => setSelectedTx(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="inspect-header-block">
                <div>
                  <h3 style={{ margin: 0 }}>{selectedTx.description}</h3>
                  <div style={{ color: "#687386", fontSize: 13, marginTop: 4 }}>
                    Category: <strong>{selectedTx.category}</strong> • Amount: <strong>₹{Number(selectedTx.amount).toLocaleString("en-IN")}</strong>
                  </div>
                </div>
                {selectedTx.fraud && (
                  <span className={`badge badge-fraud badge-fraud-${selectedTx.fraud.risk.level}`}>
                    {selectedTx.fraud.risk.label} ({Math.round(selectedTx.fraud.score * 100)}%)
                  </span>
                )}
              </div>

              {selectedTx.fraud?.explanation && (
                <div className="anomaly-explanation-card" style={{ margin: "14px 0" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                    {selectedTx.fraud.explanation}
                  </p>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    <strong>Action:</strong> {selectedTx.fraud.decisionAction || selectedTx.fraud.decision}
                  </div>
                </div>
              )}

              <div className="inspect-features-grid">
                <div className="feature-tile">
                  <span className="tile-title">Simulated Hour</span>
                  <span className="tile-value">{selectedTx.hour != null ? `${selectedTx.hour}:00` : "12:00"}</span>
                  <span className="tile-desc">{selectedTx.hour < 6 ? "⚠️ Off-hours activity" : "Normal hours"}</span>
                </div>

                <div className="feature-tile">
                  <span className="tile-title">Amount (₹)</span>
                  <span className="tile-value">₹{Number(selectedTx.amount).toLocaleString("en-IN")}</span>
                  <span className="tile-desc">
                    {selectedTx.amount > 50000 ? "⚠️ High-value outlier" : "Standard range"}
                  </span>
                </div>

                <div className="feature-tile">
                  <span className="tile-title">Path Depth E[h(x)]</span>
                  <span className="tile-value">
                    {selectedTx.fraud?.pathMetrics?.avgPathLength != null
                      ? `${selectedTx.fraud.pathMetrics.avgPathLength} edges`
                      : "< 8 edges"}
                  </span>
                  <span className="tile-desc">Expected c(n): 10.25</span>
                </div>

                <div className="feature-tile">
                  <span className="tile-title">Inference Time</span>
                  <span className="tile-value">{selectedTx._latencyMs != null ? `${selectedTx._latencyMs} ms` : "< 1 ms"}</span>
                  <span className="tile-desc">Evaluated through 50 trees</span>
                </div>
              </div>

              {selectedTx.fraud?.contributingFactors && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                    Contributing Anomaly Factors
                  </div>
                  <div className="attribution-list">
                    {selectedTx.fraud.contributingFactors.map((factor, idx) => (
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
                <Button onClick={() => setSelectedTx(null)}>Close Inspection</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamMonitor;
