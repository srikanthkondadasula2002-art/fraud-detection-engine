/**
 * fraudUtils.js
 * Feature engineering utilities for the Fraud Prediction Pipeline.
 *
 * Converts a raw FinSight transaction object into the 6-dimensional numeric
 * feature vector that the loaded Isolation Forest model expects:
 *   [amount, hour, day_of_week, is_weekend, amount_zscore, category_enc]
 */

/**
 * Build the feature vector for a single transaction.
 *
 * @param {object} transaction  - FinSight transaction record
 * @param {object} modelMeta    - The loaded model's feature_stats + category_map
 * @returns {number[]}          - Feature array [amount, hour, dow, isWeekend, zScore, catEnc]
 */
export function extractFeatures(transaction, modelMeta) {
  const { feature_stats, category_map } = modelMeta;

  // ── amount ──────────────────────────────────────────────────────────────────
  const amount = Math.abs(Number(transaction.amount)) || 0;

  // ── temporal features ──────────────────────────────────────────────────────
  let hour = 12;
  let dow = 1;

  if (typeof transaction.hour === "number") {
    hour = transaction.hour;
  } else if (transaction.time) {
    const parts = transaction.time.split(":");
    if (parts.length > 0 && !isNaN(Number(parts[0]))) {
      hour = Number(parts[0]);
    }
  }

  if (transaction.date) {
    const dateObj = new Date(transaction.date + "T12:00:00");
    if (!isNaN(dateObj.getTime())) {
      dow = dateObj.getDay();
    }
  } else {
    dow = new Date().getDay();
  }

  const isWeekend = dow === 0 || dow === 6 ? 1 : 0;

  // ── amount z-score (standardise against training distribution) ───────────────
  const amtStats = feature_stats["amount"];
  const amountZscore = amtStats.std > 0
    ? (amount - amtStats.mean) / amtStats.std
    : 0;

  // ── category encoding ────────────────────────────────────────────────────────
  const category = transaction.category || "Other";
  const categoryEnc = category_map[category] ?? category_map["Other"] ?? 9;

  return [amount, hour, dow, isWeekend, amountZscore, categoryEnc];
}

/**
 * Map a raw Isolation Forest anomaly score (0–1) to a human-readable risk level.
 *
 * @param {number} score  - anomaly score in [0, 1]
 * @returns {{ level: string, label: string, color: string }}
 */
export function riskLevel(score) {
  if (score >= 0.62) return { level: "high",   label: "High Risk",   color: "#dc2626" };
  if (score >= 0.50) return { level: "medium", label: "Medium Risk", color: "#f59e0b" };
  return                    { level: "low",    label: "Low Risk",    color: "#16a34a" };
}
