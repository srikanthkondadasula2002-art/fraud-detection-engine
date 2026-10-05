import { Cpu, Network, Radio, ShieldAlert } from "lucide-react";
import StreamMonitor from "../components/fraud/StreamMonitor";

function FraudMonitor({
  streamState,
  modelLoading,
  modelError,
  modelMetadata,
}) {
  return (
    <section className="page">
      <div className="page-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1>Streaming Fraud Radar</h1>
              <span className="live-stream-badge">
                <Radio size={14} className="pulse-icon" /> LIVE STREAM
              </span>
            </div>
            <p>
              Real-time anomaly scoring pipeline evaluating streaming financial transactions using an embedded Isolation Forest model.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Stream Monitor & Radar ── */}
      <StreamMonitor
        streamState={streamState}
        modelLoading={modelLoading}
        modelError={modelError}
      />

      {/* ── Pipeline Architecture Insights Card ── */}
      <div className="card stream-architecture-card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Streaming Pipeline Architecture</h3>
        <div className="pipeline-flow-grid">
          <div className="pipeline-step-box">
            <div className="step-num">Step 1</div>
            <div className="step-icon"><Network size={20} /></div>
            <strong>Event Ingestion</strong>
            <p>Transactions arrive asynchronously via real-time stream simulation at configurable intervals.</p>
          </div>

          <div className="pipeline-step-box">
            <div className="step-num">Step 2</div>
            <div className="step-icon"><Cpu size={20} /></div>
            <strong>Feature Engineering</strong>
            <p>6D numeric vector extracted: amount, hour of day, day of week, weekend flag, z-score, and category encoding.</p>
          </div>

          <div className="pipeline-step-box">
            <div className="step-num">Step 3</div>
            <div className="step-icon"><ShieldAlert size={20} /></div>
            <strong>Isolation Forest Scoring</strong>
            <p>Traversed through 50 isolation trees; computes average path length and anomaly score in &lt;1ms.</p>
          </div>

          <div className="pipeline-step-box">
            <div className="step-num">Step 4</div>
            <div className="step-icon"><Radio size={20} /></div>
            <strong>Alerting & Ingestion</strong>
            <p>High-risk scores trigger immediate alerts, visual warning pulses, and optional ledger syncing.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FraudMonitor;
