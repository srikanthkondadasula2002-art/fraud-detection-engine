/**
 * scripts/generate_anomaly_scores.js
 * Commit 3 — Generate anomaly scores.
 *
 * Standalone Node.js CLI tool that runs the complete Isolation Forest anomaly scoring engine
 * over transaction datasets, computing:
 *   • Continuous anomaly scores in [0, 1] using path length correction
 *   • Per-tree traversal statistics (avg depth, min/max path length, consensus)
 *   • Feature attribution (Amount outlier, off-hours timing, category risk)
 *   • Decision recommendations (APPROVE, MANUAL_AUDIT, BLOCK_AND_REVIEW)
 *   • Batch distribution quantiles and exports JSON report
 *
 * Usage:
 *   node scripts/generate_anomaly_scores.js
 *   npm run score
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { IsolationForest } from "../src/fraud/isolationForest.js";
import { generateAnomalyScore, generateBatchAnomalyScores } from "../src/fraud/anomalyScorer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Load trained model
const modelPath = resolve(__dirname, "../public/fraud_model.json");
console.log("\n" + "=".repeat(85));
console.log("   FINSIGHT FRAUD PREDICTION ENGINE — COMMIT 3: GENERATE ANOMALY SCORES");
console.log("=".repeat(85));

const modelJson = JSON.parse(readFileSync(modelPath, "utf-8"));
const model = new IsolationForest(modelJson);

console.log(`[Isolation Forest Engine]`);
console.log(` • Algorithm:         Isolation Forest (Liu, Ting, Zhou - 2008)`);
console.log(` • Trees (n_trees):   ${model.trees.length}`);
console.log(` • Subsample (ψ):     ${model.metadata.maxSamples}`);
console.log(` • BST Factor c(ψ):   ${model.cFactor.toFixed(3)}`);
console.log(` • Contamination:     ${model.metadata.contamination * 100}%`);
console.log(` • Features:          ${model.features.join(", ")}`);
console.log("=".repeat(85));

// 2. Representative evaluation transaction suite
const testTransactions = [
  // Normal everyday expenses
  { id: "TX-101", description: "Supermart Groceries", category: "Food", type: "expense", amount: 1450, time: "14:30:00", date: "2026-10-06" },
  { id: "TX-102", description: "Petrol Pump Refuel", category: "Transport", type: "expense", amount: 1200, time: "09:15:00", date: "2026-10-06" },
  { id: "TX-103", description: "Monthly House Rent", category: "Housing", type: "expense", amount: 14000, time: "11:00:00", date: "2026-10-06" },
  { id: "TX-104", description: "High-Speed Broadband Bill", category: "Utilities", type: "expense", amount: 999, time: "15:45:00", date: "2026-10-06" },
  { id: "TX-105", description: "Swiggy Dinner Order", category: "Food", type: "expense", amount: 480, time: "20:30:00", date: "2026-10-06" },
  { id: "TX-106", description: "Monthly Software Salary", category: "Salary", type: "income", amount: 75000, time: "10:00:00", date: "2026-10-06" },

  // Borderline / Moderate spending
  { id: "TX-201", description: "Electronics Mall Weekend Purchase", category: "Shopping", type: "expense", amount: 24500, time: "21:40:00", date: "2026-10-04" },
  { id: "TX-202", description: "Weekend Resort Getaway", category: "Entertainment", type: "expense", amount: 18500, time: "22:15:00", date: "2026-10-03" },
  { id: "TX-203", description: "Late-Night Pharmacy Delivery", category: "Healthcare", type: "expense", amount: 3200, time: "23:55:00", date: "2026-10-06" },

  // Severe anomalies & fraud patterns
  { id: "TX-301", description: "Luxury Diamonds Boutique", category: "Shopping", type: "expense", amount: 285000, time: "03:15:00", date: "2026-10-06" },
  { id: "TX-302", description: "Crypto OTC Instant Exchange", category: "Other", type: "expense", amount: 420000, time: "02:40:00", date: "2026-10-06" },
  { id: "TX-303", description: "Cross-Border Wire Transfer", category: "Other", type: "expense", amount: 560000, time: "03:55:00", date: "2026-10-06" },
  { id: "TX-304", description: "Offshore Gaming Merchant", category: "Entertainment", type: "expense", amount: 165000, time: "04:10:00", date: "2026-10-06" },
  { id: "TX-305", description: "High-Value ATM Cash Burst", category: "Other", type: "expense", amount: 80000, time: "04:45:00", date: "2026-10-06" },
];

console.log("\n[Scoring Engine] Generating anomaly scores for transactions...\n");

// Currency formatter
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

// Print Table Header
console.log(
  "ID".padEnd(8) +
  "DESCRIPTION".padEnd(28) +
  "AMOUNT".padEnd(14) +
  "TIME".padEnd(10) +
  "E(h)".padEnd(7) +
  "SCORE".padEnd(10) +
  "RISK".padEnd(12) +
  "TOP CONTRIBUTING FACTOR".padEnd(30) +
  "DECISION"
);
console.log("-".repeat(128));

const batchResult = generateBatchAnomalyScores(testTransactions, model);
const reportRecords = [];

batchResult.scored.forEach((tx) => {
  const f = tx.fraud;
  const topFactor = f.contributingFactors[0];
  const factorStr = `${topFactor.name} (${topFactor.percentage}%)`;

  const riskColored =
    f.risk.level === "high"
      ? `\x1b[31m${f.risk.label}\x1b[0m`
      : f.risk.level === "medium"
      ? `\x1b[33m${f.risk.label}\x1b[0m`
      : `\x1b[32m${f.risk.label}\x1b[0m`;

  const scoreStr = `${(f.score * 100).toFixed(1)}%`;

  console.log(
    tx.id.padEnd(8) +
    tx.description.slice(0, 26).padEnd(28) +
    inr(tx.amount).padEnd(14) +
    (tx.time || "--").padEnd(10) +
    String(f.pathMetrics.avgPathLength).padEnd(7) +
    scoreStr.padEnd(10) +
    riskColored.padEnd(21) +
    factorStr.padEnd(30) +
    f.decision
  );

  reportRecords.push({
    id: tx.id,
    description: tx.description,
    amount: tx.amount,
    category: tx.category,
    time: tx.time,
    anomalyScore: f.score,
    anomalyPercentage: f.scorePercent,
    riskLevel: f.risk.level,
    decision: f.decision,
    decisionAction: f.decisionAction,
    avgPathLength: f.pathMetrics.avgPathLength,
    expectedPathLength: f.pathMetrics.cFactor,
    contributingFactors: f.contributingFactors,
    explanation: f.explanation,
  });
});

console.log("-".repeat(128));

// 3. Batch Anomaly Score Distribution Analytics
const s = batchResult.summary;
console.log("\n" + "=".repeat(85));
console.log("   DATASET ANOMALY SCORE METRICS & DISTRIBUTION REPORT");
console.log("=".repeat(85));
console.log(` • Transactions Scored:       ${s.total}`);
console.log(` • Mean Anomaly Score:        ${s.averageScore}%`);
console.log(` • Contamination Rate:        ${s.anomalyRate}% (${s.highRiskCount + s.mediumRiskCount} of ${s.total} transactions flagged)`);
console.log(` • High Risk (Score ≥ 62%):   ${s.highRiskCount} transactions`);
console.log(` • Medium Risk (50% - 61%):   ${s.mediumRiskCount} transactions`);
console.log(` • Low Risk (Score < 50%):    ${s.lowRiskCount} transactions`);
console.log("\n[Anomaly Score Distribution Histogram]:");
s.distribution.forEach((bucket) => {
  const bar = "█".repeat(bucket.count * 3);
  console.log(`   ${bucket.range.padEnd(12)} [${bucket.label.padEnd(9)}] : ${bar.padEnd(18)} (${bucket.count})`);
});

// 4. Save JSON Report artifact
const reportPath = resolve(__dirname, "../anomaly_scores_report.json");
const outputJson = {
  engine: "FinSight Isolation Forest Anomaly Scoring Engine",
  version: "1.1.0",
  evaluatedAt: new Date().toISOString(),
  summary: s,
  records: reportRecords,
};
writeFileSync(reportPath, JSON.stringify(outputJson, null, 2), "utf-8");
console.log(`\n[Artifact] Full JSON anomaly score report exported to:`);
console.log(`           ${reportPath}`);
console.log("=".repeat(85) + "\n");
