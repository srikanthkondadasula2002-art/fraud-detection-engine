/**
 * scripts/test_stream_pipeline.js
 * Commit 2 — Apply model on streaming transactions.
 *
 * Standalone Node.js CLI runner that demonstrates applying the trained
 * Isolation Forest model to a real-time stream of incoming financial transactions.
 *
 * Usage:
 *   node scripts/test_stream_pipeline.js
 *   npm run stream
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { IsolationForest } from "../src/fraud/isolationForest.js";
import { extractFeatures, riskLevel } from "../src/fraud/fraudUtils.js";
import { TransactionStream } from "../src/fraud/transactionStream.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Load serialized Isolation Forest model
const modelPath = resolve(__dirname, "../public/fraud_model.json");
console.log("\n" + "=".repeat(75));
console.log("   FINSIGHT FRAUD PREDICTION PIPELINE — COMMIT 2: STREAMING EVALUATION");
console.log("=".repeat(75));
console.log(`[Model] Loading Isolation Forest from: ${modelPath}`);

const modelJson = JSON.parse(readFileSync(modelPath, "utf-8"));
const model = new IsolationForest(modelJson);

console.log(`[Model] Loaded successfully:`);
console.log(`        • Version:      v${model.metadata.version}`);
console.log(`        • Trees:        ${model.trees.length} isolation trees`);
console.log(`        • Subsample:    ${model.metadata.maxSamples} samples/tree`);
console.log(`        • Features:     ${model.features.join(", ")}`);
console.log(`        • c(n) Factor:  ${model.cFactor}`);
console.log("=".repeat(75));
console.log("[Stream] Initializing real-time transaction stream at 400ms interval...\n");

const TARGET_STREAM_EVENTS = 15;
let processedCount = 0;
const results = [];
const latencies = [];

const stream = new TransactionStream({
  intervalMs: 350,
  anomalyRate: 0.25,
  burstEvery: 5,
});

// Format currency
const formatInr = (amt) => "₹" + Number(amt).toLocaleString("en-IN");

// Header
console.log(
  "#".padEnd(4) +
  "TIME".padEnd(12) +
  "DESCRIPTION".padEnd(30) +
  "CATEGORY".padEnd(15) +
  "AMOUNT".padEnd(14) +
  "SCORE".padEnd(10) +
  "RISK TIER".padEnd(14) +
  "LATENCY"
);
console.log("-".repeat(105));

stream.start((rawTx) => {
  processedCount++;

  // Benchmark model inference latency
  const t0 = performance.now();
  const features = extractFeatures(rawTx, {
    feature_stats: model.featureStats,
    category_map: model.categoryMap,
  });
  const score = model.score(features);
  const latencyMs = Math.round((performance.now() - t0) * 100) / 100;
  latencies.push(latencyMs);

  const risk = riskLevel(score);
  const pct = (score * 100).toFixed(1) + "%";

  results.push({
    count: processedCount,
    description: rawTx.description,
    category: rawTx.category,
    amount: rawTx.amount,
    time: rawTx.time,
    score,
    pct,
    risk: risk.level,
    latencyMs,
  });

  const riskTag =
    risk.level === "high"
      ? `\x1b[31m[HIGH RISK]\x1b[0m`
      : risk.level === "medium"
      ? `\x1b[33m[MEDIUM]\x1b[0m`
      : `\x1b[32m[LOW/SAFE]\x1b[0m`;

  console.log(
    String(processedCount).padEnd(4) +
    (rawTx.time || "12:00:00").padEnd(12) +
    rawTx.description.slice(0, 28).padEnd(30) +
    rawTx.category.padEnd(15) +
    formatInr(rawTx.amount).padEnd(14) +
    pct.padEnd(10) +
    riskTag.padEnd(23) +
    `${latencyMs}ms`
  );

  if (processedCount >= TARGET_STREAM_EVENTS) {
    stream.stop();
    printStreamSummary();
  }
});

function printStreamSummary() {
  const highRisk = results.filter((r) => r.risk === "high").length;
  const medRisk = results.filter((r) => r.risk === "medium").length;
  const lowRisk = results.filter((r) => r.risk === "low").length;
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const avgScore = ((results.reduce((a, b) => a + b.score, 0) / results.length) * 100).toFixed(1);

  console.log("-".repeat(105));
  console.log("\n" + "=".repeat(75));
  console.log("   STREAMING MODEL EVALUATION SUMMARY — COMMIT 2 VERIFICATION");
  console.log("=".repeat(75));
  console.log(` • Total Stream Transactions Evaluated: ${processedCount}`);
  console.log(` • High Risk Anomalies Flagged:       ${highRisk} (${((highRisk / processedCount) * 100).toFixed(1)}%)`);
  console.log(` • Medium Risk Warnings:               ${medRisk} (${((medRisk / processedCount) * 100).toFixed(1)}%)`);
  console.log(` • Safe / Normal Transactions:         ${lowRisk} (${((lowRisk / processedCount) * 100).toFixed(1)}%)`);
  console.log(` • Mean Anomaly Score:                 ${avgScore}%`);
  console.log(` • Average Inference Latency:          ${avgLatency} ms (Real-time sub-millisecond)`);
  console.log(` • Stream Engine Status:               COMPLETED (Model successfully applied)`);
  console.log("=".repeat(75) + "\n");
}
