/**
 * isolationForest.js
 * Pure-JS Isolation Forest inference engine.
 *
 * Loads a pre-serialised model from a JSON asset (public/fraud_model.json)
 * and exposes a `score(features)` function that returns an anomaly score
 * in [0, 1] — the higher the score, the more anomalous the observation.
 *
 * Algorithm (Liu et al., 2008):
 *   1. For each isolation tree, traverse until a leaf, recording path length h.
 *   2. Average path length across all trees → E[h(x)].
 *   3. Anomaly score  s(x, n) = 2^( -E[h(x)] / c(n) )
 *      where c(n) is the average path length of an unsuccessful BST search.
 *
 * The JSON model stores each tree as a flat node array.  Internal nodes carry
 * `{ feature, threshold, left, right }` and leaf nodes carry `{ leaf, depth }`.
 */

// ────────────────────────────────────────────────────────────────────────────
// Average path-length correction factor  c(n)
// c(n) = 2 * H(n-1) - (2(n-1)/n)   where H(k) ≈ ln(k) + 0.5772156649
// ────────────────────────────────────────────────────────────────────────────
function harmonicNumber(k) {
  return k <= 0 ? 0 : Math.log(k) + 0.5772156649;
}

function cFactor(n) {
  if (n <= 1) return 0;
  return 2 * harmonicNumber(n - 1) - (2 * (n - 1)) / n;
}

// ────────────────────────────────────────────────────────────────────────────
// Traverse a single isolation tree; return the path length for `features`.
// ────────────────────────────────────────────────────────────────────────────
function pathLength(nodes, features) {
  let nodeId = 0;
  let depth = 0;

  while (true) {
    const node = nodes[nodeId];
    if (!node) break; // safety guard

    if (node.leaf) {
      // Adjust for the expected additional path through the unresolved subtree
      const subtreeC = cFactor(node.size);
      return depth + subtreeC;
    }

    const featureValue = features[node.feature];
    depth++;

    if (featureValue <= node.threshold) {
      nodeId = node.left;
    } else {
      nodeId = node.right;
    }
  }

  return depth;
}

// ────────────────────────────────────────────────────────────────────────────
// IsolationForest class — wraps a loaded JSON model
// ────────────────────────────────────────────────────────────────────────────
export class IsolationForest {
  /**
   * @param {object} modelJson  - Parsed content of public/fraud_model.json
   */
  constructor(modelJson) {
    this._meta = {
      version:      modelJson.__version__,
      trainedOn:    modelJson.__trained_on__,
      nSamples:     modelJson.__n_samples__,
      nEstimators:  modelJson.__n_estimators__,
      maxSamples:   modelJson.__max_samples__,
      contamination: modelJson.__contamination__,
    };

    this.features      = modelJson.features;       // string[] — feature names
    this.featureStats  = modelJson.feature_stats;  // per-feature {mean, std}
    this.categoryMap   = modelJson.category_map;   // category → int
    this.cFactor       = modelJson.c_factor;       // pre-computed c(max_samples)
    this.trees         = modelJson.trees;          // [{id, nodes:[]}]

    // Build fast lookup: treeId → nodeMap (id → node)
    this._nodeMaps = this.trees.map((tree) => {
      const map = {};
      for (const node of tree.nodes) {
        map[node.id] = node;
      }
      return map;
    });

    console.info(
      `[FraudModel] IsolationForest v${this._meta.version} loaded — ` +
      `${this.trees.length} trees, trained ${this._meta.trainedOn}`
    );
  }

  /**
   * Compute the anomaly score for a pre-extracted feature vector.
   *
   * @param {number[]} features - Feature vector matching `this.features` order
   * @returns {number}          - Anomaly score in [0, 1]
   */
  score(features) {
    let totalPathLength = 0;

    for (let i = 0; i < this._nodeMaps.length; i++) {
      totalPathLength += pathLength(this._nodeMaps[i], features);
    }

    const avgPathLength = totalPathLength / this._nodeMaps.length;
    const c = this.cFactor > 0 ? this.cFactor : cFactor(this._meta.maxSamples);

    // s ∈ (0, 1): values close to 1 → anomaly, close to 0.5 → normal
    return Math.pow(2, -avgPathLength / c);
  }

  /**
   * Compute comprehensive anomaly score with per-tree path length telemetry.
   *
   * @param {number[]} features - Feature vector matching `this.features` order
   * @returns {{
   *   score: number,
   *   avgPathLength: number,
   *   cFactor: number,
   *   minPathLength: number,
   *   maxPathLength: number,
   *   pathLengthStd: number,
   *   treeCount: number,
   *   confidence: number,
   *   pathLengths: number[]
   * }}
   */
  scoreDetailed(features) {
    const pathLengths = new Array(this._nodeMaps.length);
    let totalPathLength = 0;
    let minPath = Infinity;
    let maxPath = -Infinity;

    for (let i = 0; i < this._nodeMaps.length; i++) {
      const h = pathLength(this._nodeMaps[i], features);
      pathLengths[i] = h;
      totalPathLength += h;
      if (h < minPath) minPath = h;
      if (h > maxPath) maxPath = h;
    }

    const treeCount = this._nodeMaps.length;
    const avgPathLength = totalPathLength / treeCount;
    const c = this.cFactor > 0 ? this.cFactor : cFactor(this._meta.maxSamples);

    // Standard deviation of path lengths across trees
    let variance = 0;
    for (let i = 0; i < treeCount; i++) {
      const diff = pathLengths[i] - avgPathLength;
      variance += diff * diff;
    }
    const pathLengthStd = Math.sqrt(variance / treeCount);

    // Anomaly score  s(x, n) = 2^( -E[h(x)] / c(n) )
    const rawScore = Math.pow(2, -avgPathLength / c);

    // Confidence: lower variance across trees indicates higher forest consensus
    const consensus = Math.max(0, Math.min(1, 1 - (pathLengthStd / (c * 0.6))));

    return {
      score: rawScore,
      avgPathLength: Math.round(avgPathLength * 100) / 100,
      cFactor: Math.round(c * 100) / 100,
      minPathLength: Math.round(minPath * 100) / 100,
      maxPathLength: Math.round(maxPath * 100) / 100,
      pathLengthStd: Math.round(pathLengthStd * 100) / 100,
      treeCount,
      confidence: Math.round(consensus * 100) / 100,
      pathLengths,
    };
  }

  /** Human-readable metadata for debugging / display */
  get metadata() {
    return { ...this._meta };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Load the saved model JSON from the Vite public directory.
// Returns a ready-to-use IsolationForest instance.
// ────────────────────────────────────────────────────────────────────────────
/**
 * Fetches and deserialises the saved Isolation Forest model.
 *
 * @returns {Promise<IsolationForest>}
 */
export async function loadSavedModel() {
  const url = "/fraud_model.json";

  console.info("[FraudModel] Fetching saved model from", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `[FraudModel] Failed to load model: HTTP ${response.status} ${response.statusText}`
    );
  }

  const modelJson = await response.json();

  if (modelJson.__model__ !== "IsolationForest") {
    throw new Error(
      `[FraudModel] Unexpected model type: "${modelJson.__model__}"`
    );
  }

  return new IsolationForest(modelJson);
}
