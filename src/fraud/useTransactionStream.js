/**
 * useTransactionStream.js
 * Commit 2 — Apply model on streaming transactions.
 *
 * Manages the lifecycle of a TransactionStream and applies the Isolation Forest
 * model to every transaction the instant it arrives from the live stream.
 *
 * Architecture:
 *   TransactionStream (timer / event source)
 *          │
 *          ▼ emit(rawTx)
 *   useTransactionStream (hook)
 *          │
 *          ├─► scoreTransaction(rawTx)  [Isolation Forest pure-JS inference]
 *          ├─► measure inference latency (performance benchmarking)
 *          ├─► push to rolling feed buffer (capped)
 *          ├─► push high/medium anomalies to alert notifications
 *          └─► optionally forward to main finance ledger (live auto-sync)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionStream } from "./transactionStream";

const MAX_FEED_SIZE = 40;  // Rolling window of recent streamed transactions
const MAX_ALERT_SIZE = 12; // Queue of prominent anomaly alert notifications

/**
 * @typedef {object} ScoredStreamTransaction
 * @property {string|number} id
 * @property {string}  description
 * @property {string}  category
 * @property {string}  type
 * @property {number}  amount
 * @property {string}  date
 * @property {string}  time
 * @property {number}  hour
 * @property {number}  timestamp
 * @property {boolean} _streamed
 * @property {boolean} _anomaly
 * @property {string}  _arrivedAt
 * @property {number}  _latencyMs
 * @property {{ score: number, risk: { level: string, label: string, color: string } } | null} fraud
 */

/**
 * Hook to run and monitor streaming transactions with the Isolation Forest model.
 *
 * @param {object} params
 * @param {function|null} params.scoreTransaction - From useFraudModel
 * @param {function|null} [params.onNewTransaction] - Optional callback to append to main ledger
 * @param {number}        [params.intervalMs=2500] - Stream interval
 * @param {boolean}       [params.autoStart=false] - Whether to start on mount
 */
export function useTransactionStream({
  scoreTransaction,
  onNewTransaction = null,
  intervalMs = 2500,
  autoStart = false,
} = {}) {
  const [feed, setFeed] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [running, setRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(intervalMs);
  const [syncWithLedger, setSyncWithLedger] = useState(false);

  // Aggregated stream stats
  const [stats, setStats] = useState({
    totalSeen: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    lastLatencyMs: 0,
  });

  // Stable references
  const scoreRef = useRef(scoreTransaction);
  const onNewRef = useRef(onNewTransaction);
  const syncRef = useRef(syncWithLedger);
  const streamRef = useRef(null);

  useEffect(() => { scoreRef.current = scoreTransaction; }, [scoreTransaction]);
  useEffect(() => { onNewRef.current = onNewTransaction; }, [onNewTransaction]);
  useEffect(() => { syncRef.current = syncWithLedger; }, [syncWithLedger]);

  /**
   * Process a single streaming transaction event.
   * Runs synchronously on arrival so scores are computed before DOM paint.
   */
  const handleIncomingTransaction = useCallback((rawTx) => {
    const arrivalTime = new Date();
    const id = `tx_stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const arrivedAt = arrivalTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // ── Benchmark model inference latency ───────────────────────────────────
    const t0 = performance.now();
    const fraud = scoreRef.current ? scoreRef.current(rawTx) : null;
    const latencyMs = Math.round((performance.now() - t0) * 100) / 100;

    const scored = {
      ...rawTx,
      id,
      _arrivedAt: arrivedAt,
      _latencyMs: latencyMs,
      fraud,
    };

    console.debug(
      `[TransactionStream] Scored: ${scored.description} | ₹${scored.amount} | ` +
      `Score: ${fraud ? (fraud.score * 100).toFixed(1) + "%" : "n/a"} | ` +
      `Risk: ${fraud?.risk?.level ?? "unknown"} | ${latencyMs}ms`
    );

    // ── Update rolling feed ─────────────────────────────────────────────────
    setFeed((prev) => [scored, ...prev].slice(0, MAX_FEED_SIZE));

    // ── Update running statistics ───────────────────────────────────────────
    const riskLevel = fraud?.risk?.level || "low";
    setStats((prev) => ({
      totalSeen: prev.totalSeen + 1,
      highRisk: riskLevel === "high" ? prev.highRisk + 1 : prev.highRisk,
      mediumRisk: riskLevel === "medium" ? prev.mediumRisk + 1 : prev.mediumRisk,
      lowRisk: riskLevel === "low" ? prev.lowRisk + 1 : prev.lowRisk,
      lastLatencyMs: latencyMs,
    }));

    // ── Add high/medium alerts ──────────────────────────────────────────────
    if (riskLevel === "high" || riskLevel === "medium") {
      setAlerts((prev) => [scored, ...prev].slice(0, MAX_ALERT_SIZE));
    }

    // ── Optional forward to main ledger ─────────────────────────────────────
    if (syncRef.current && onNewRef.current) {
      onNewRef.current({
        id: Date.now(),
        description: scored.description,
        category: scored.category,
        type: scored.type,
        amount: Number(scored.amount),
        date: scored.date,
        fraud: scored.fraud,
      });
    }
  }, []);

  // ── Stream controls ───────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (!streamRef.current) {
      streamRef.current = new TransactionStream({ intervalMs: currentSpeed });
    }
    streamRef.current.start(handleIncomingTransaction);
    setRunning(true);
  }, [currentSpeed, handleIncomingTransaction]);

  const pause = useCallback(() => {
    streamRef.current?.pause();
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (!streamRef.current) {
      streamRef.current = new TransactionStream({ intervalMs: currentSpeed });
      streamRef.current.start(handleIncomingTransaction);
    } else {
      streamRef.current.resume();
    }
    setRunning(true);
  }, [currentSpeed, handleIncomingTransaction]);

  const stop = useCallback(() => {
    streamRef.current?.stop();
    streamRef.current = null;
    setRunning(false);
  }, []);

  const clearFeed = useCallback(() => {
    setFeed([]);
    setAlerts([]);
    setStats({
      totalSeen: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      lastLatencyMs: 0,
    });
  }, []);

  const setSpeed = useCallback((newSpeedMs) => {
    setCurrentSpeed(newSpeedMs);
    streamRef.current?.setSpeed(newSpeedMs);
  }, []);

  /**
   * Instantly generate and score a simulated transaction on demand.
   * @param {boolean} forceAnomaly
   */
  const emitNow = useCallback((forceAnomaly = false) => {
    if (!streamRef.current) {
      streamRef.current = new TransactionStream({ intervalMs: currentSpeed });
    }
    // If stream is not actively running with timer, temporarily attach callback and emit
    if (!streamRef.current.isRunning) {
      streamRef.current.start(handleIncomingTransaction);
      streamRef.current.pause(); // keep callback attached without running timer
    }
    streamRef.current.emitNow(forceAnomaly);
  }, [currentSpeed, handleIncomingTransaction]);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      streamRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
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
  };
}
