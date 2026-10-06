/**
 * useFraudModel.js
 * React hook that loads the saved Isolation Forest model once on mount
 * and exposes a `scoreTransaction(transaction)` helper.
 *
 * Usage:
 *   const { model, loading, error, scoreTransaction } = useFraudModel();
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSavedModel } from "./isolationForest";
import { generateAnomalyScore, generateBatchAnomalyScores } from "./anomalyScorer";

/**
 * @typedef {object} FraudModelState
 * @property {import('./isolationForest').IsolationForest | null} model
 * @property {boolean}   loading   - true while the model JSON is being fetched
 * @property {string | null} error - non-null if loading failed
 * @property {function}  scoreTransaction  - scores a raw transaction object
 * @property {function}  scoreBatch - scores an array of transactions with distribution metrics
 */

/**
 * Load the Isolation Forest model and expose a per-transaction scorer.
 *
 * @returns {FraudModelState}
 */
export function useFraudModel() {
  const [model,   setModel]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Keep a stable ref so that `scoreTransaction` never goes stale
  const modelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        const loadedModel = await loadSavedModel();

        if (!cancelled) {
          modelRef.current = loadedModel;
          setModel(loadedModel);
          console.info("[useFraudModel] Model ready.", loadedModel.metadata);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useFraudModel] Failed to load model:", err);
          setError(err.message || "Unknown error loading fraud model");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Score a single raw FinSight transaction with complete anomaly telemetry.
   *
   * @param {object} transaction
   * @returns {object | null} Full anomaly score report or null if model pending
   */
  const scoreTransaction = useCallback((transaction) => {
    const m = modelRef.current;
    if (!m) return null;
    return generateAnomalyScore(transaction, m);
  }, []);

  /**
   * Batch score an array of transactions.
   */
  const scoreBatch = useCallback((transactions) => {
    const m = modelRef.current;
    if (!m) return { scored: transactions, summary: null };
    return generateBatchAnomalyScores(transactions, m);
  }, []);

  return { model, loading, error, scoreTransaction, scoreBatch };
}
