import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Button from "../common/Button";

function StreamMonitor({
  streamState,
  modelLoading,
  modelError,
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
                  ? `Emitting every ${currentSpeed / 1000}s • Scoring via client-side Isolation Forest (${stats.lastLatencyMs}ms latency)`
                  : "Start the stream to simulate incoming transactions evaluated in real time"}
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
      </div>

      {/* ── Real-Time Metrics Grid ── */}
      <div className="stream-metrics-grid">
        <div className="stream-metric-card metric-total">
          <div className="metric-icon">
            <Activity size={22} />
          </div>
          <div>
            <div className="metric-label">Total Evaluated</div>
            <div className="metric-value">{stats.totalSeen}</div>
            <div className="metric-foot">Streaming buffer size: {feed.length}</div>
          </div>
        </div>

        <div className="stream-metric-card metric-danger">
          <div className="metric-icon">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="metric-label">High Risk Flagged</div>
            <div className="metric-value">{stats.highRisk}</div>
            <div className="metric-foot">Anomaly score &ge; 62%</div>
          </div>
        </div>

        <div className="stream-metric-card metric-warning">
          <div className="metric-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="metric-label">Medium Risk</div>
            <div className="metric-value">{stats.mediumRisk}</div>
            <div className="metric-foot">Anomaly score 50% - 61%</div>
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
                  <th>Model Score</th>
                  <th>Risk Level</th>
                  <th>Inference</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((tx, idx) => {
                  const score = tx.fraud?.score ?? 0;
                  const pct = Math.round(score * 100);
                  const risk = tx.fraud?.risk ?? { level: "low", label: "Low Risk", color: "#16a34a" };
                  const isNewest = idx === 0;

                  return (
                    <tr
                      key={tx.id}
                      className={`stream-row stream-row-${risk.level} ${isNewest ? "stream-row-new" : ""}`}
                      onClick={() => setSelectedTx(tx)}
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
                              className={`stream-score-bar-fill fill-${risk.level}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="stream-score-text">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge badge-fraud badge-fraud-${risk.level}`}
                          style={{ "--fraud-color": risk.color }}
                        >
                          {risk.label}
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
              <h2>Transaction Scoring Inspection</h2>
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
                  <span className="tile-title">Inference Time</span>
                  <span className="tile-value">{selectedTx._latencyMs != null ? `${selectedTx._latencyMs} ms` : "< 1 ms"}</span>
                  <span className="tile-desc">Evaluated through 50 trees</span>
                </div>

                <div className="feature-tile">
                  <span className="tile-title">Anomaly Status</span>
                  <span className="tile-value" style={{ textTransform: "capitalize" }}>
                    {selectedTx.fraud?.risk.level || "Unknown"}
                  </span>
                  <span className="tile-desc">
                    {selectedTx.fraud?.score >= 0.62 ? "Requires manual review" : "Auto-approved"}
                  </span>
                </div>
              </div>

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
