/**
 * transactionStream.js
 * Commit 2 — Apply model on streaming transactions.
 *
 * Simulates a real-time transaction data stream (as would arrive from a payment
 * gateway, card network, banking API, or Kafka/event bus).
 *
 * Features:
 *   • Configurable emission interval (e.g. 1000ms - 5000ms)
 *   • Realistic normal vs. anomalous transaction distributions
 *   • Manual injection triggers (`emitNow(forceAnomaly)`) for immediate testing
 *   • Full timestamp + time-of-day simulation to exercise temporal features
 */

// ── Curated normal spending templates ───────────────────────────────────────
const NORMAL_TEMPLATES = [
  { description: "Supermart Groceries",   category: "Food",          type: "expense", amountRange: [650, 3200],   hourRange: [10, 20] },
  { description: "Petrol Pump Refuel",    category: "Transport",     type: "expense", amountRange: [500, 2800],   hourRange: [7, 21] },
  { description: "Electricity Board Bill", category: "Utilities",    type: "expense", amountRange: [700, 2400],   hourRange: [9, 18] },
  { description: "Swiggy Food Delivery",  category: "Food",          type: "expense", amountRange: [250, 1100],   hourRange: [12, 22] },
  { description: "Metro Smart Card",      category: "Transport",     type: "expense", amountRange: [100, 600],    hourRange: [8, 20] },
  { description: "Netflix Subscription",  category: "Entertainment", type: "expense", amountRange: [199, 649],    hourRange: [0, 23] },
  { description: "Mobile Postpaid Bill",  category: "Utilities",     type: "expense", amountRange: [399, 999],    hourRange: [10, 19] },
  { description: "Gym & Fitness Club",    category: "Healthcare",    type: "expense", amountRange: [1200, 3000],  hourRange: [6, 21] },
  { description: "Apollo Pharmacy",       category: "Healthcare",    type: "expense", amountRange: [150, 1950],   hourRange: [9, 22] },
  { description: "Amazon Online Store",   category: "Shopping",      type: "expense", amountRange: [450, 4200],   hourRange: [9, 23] },
  { description: "Cafe Coffee Day",       category: "Food",          type: "expense", amountRange: [180, 750],    hourRange: [11, 21] },
  { description: "Freelance Client Payout", category: "Freelance",   type: "income",  amountRange: [5000, 25000], hourRange: [11, 18] },
  { description: "Bookstore Purchase",    category: "Shopping",      type: "expense", amountRange: [350, 1600],   hourRange: [11, 19] },
  { description: "High-Speed Internet",   category: "Utilities",     type: "expense", amountRange: [799, 1499],   hourRange: [9, 17] },
];

// ── Curated anomalous spending templates (designed to trigger Isolation Forest) ─
const ANOMALOUS_TEMPLATES = [
  { description: "Luxury Jewelry Boutique",    category: "Shopping",      type: "expense", amountRange: [85000, 320000], hourRange: [2, 4] },
  { description: "High-Value ATM Cash Burst",  category: "Other",         type: "expense", amountRange: [40000, 100000], hourRange: [3, 5] },
  { description: "Cross-Border Wire Transfer", category: "Other",         type: "expense", amountRange: [120000, 650000],hourRange: [1, 4] },
  { description: "Crypto OTC Instant Exchange",category: "Other",         type: "expense", amountRange: [75000, 480000], hourRange: [2, 5] },
  { description: "Midnight Electronic Flagship", category: "Shopping",    type: "expense", amountRange: [95000, 280000], hourRange: [3, 4] },
  { description: "Offshore Gaming Merchant",   category: "Entertainment", type: "expense", amountRange: [60000, 220000], hourRange: [1, 4] },
  { description: "Rapid Multi-Swipe Transit",  category: "Transport",     type: "expense", amountRange: [35000, 90000],  hourRange: [2, 5] },
];

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Generate a single simulated stream transaction.
 *
 * @param {boolean} forceAnomaly - If true, guarantees an anomaly template
 * @param {number}  [baseAnomalyRate=0.15] - Base probability of anomaly
 * @returns {object} Raw streaming transaction
 */
export function generateStreamTransaction(forceAnomaly = false, baseAnomalyRate = 0.15) {
  const isAnomaly = forceAnomaly || Math.random() < baseAnomalyRate;
  const pool = isAnomaly ? ANOMALOUS_TEMPLATES : NORMAL_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];

  const now = new Date();
  const year = now.getFullYear();
  const month = padZero(now.getMonth() + 1);
  const day = padZero(now.getDate());
  const dateStr = `${year}-${month}-${day}`;

  // Temporal simulation: anomalies simulate suspicious off-hours (e.g. 2-4 AM)
  const simulatedHour = randomBetween(template.hourRange[0], template.hourRange[1]);
  const simulatedMinute = randomBetween(0, 59);
  const simulatedSecond = randomBetween(0, 59);
  const timeStr = `${padZero(simulatedHour)}:${padZero(simulatedMinute)}:${padZero(simulatedSecond)}`;

  const amount = randomBetween(...template.amountRange);

  return {
    description: template.description,
    category: template.category,
    type: template.type,
    amount,
    date: dateStr,
    time: timeStr,
    hour: simulatedHour,
    timestamp: new Date(`${dateStr}T${timeStr}`).getTime() || Date.now(),
    _streamed: true,
    _anomaly: isAnomaly,
  };
}

/**
 * TransactionStream
 * Manages an asynchronous stream of transactions with lifecycle controls.
 */
export class TransactionStream {
  /**
   * @param {object} [options]
   * @param {number} [options.intervalMs=2500] - Emission interval in milliseconds
   * @param {number} [options.anomalyRate=0.15] - Base probability of anomalous event
   * @param {number} [options.burstEvery=8] - Force anomaly every N events
   */
  constructor({ intervalMs = 2500, anomalyRate = 0.15, burstEvery = 8 } = {}) {
    this.intervalMs = intervalMs;
    this.anomalyRate = anomalyRate;
    this.burstEvery = burstEvery;

    this._timer = null;
    this._count = 0;
    this._callback = null;
  }

  /**
   * Start stream emissions.
   * @param {function(object): void} onTransaction
   */
  start(onTransaction) {
    if (this._timer) return;
    this._callback = onTransaction;
    this._count = 0;

    console.info(`[TransactionStream] Started with interval: ${this.intervalMs}ms`);

    this._timer = setInterval(() => {
      this._emitNext();
    }, this.intervalMs);
  }

  /**
   * Internal generator and emitter.
   */
  _emitNext(forceAnomaly = false) {
    if (!this._callback) return;
    this._count++;
    const shouldForce = forceAnomaly || (this.burstEvery > 0 && this._count % this.burstEvery === 0);
    const tx = generateStreamTransaction(shouldForce, this.anomalyRate);
    this._callback(tx);
  }

  /**
   * Instantly emit a transaction out-of-band (e.g. from user "Inject" button).
   */
  emitNow(forceAnomaly = false) {
    if (this._callback) {
      this._emitNext(forceAnomaly);
    }
  }

  /**
   * Dynamically adjust emission interval.
   */
  setSpeed(newIntervalMs) {
    this.intervalMs = Math.max(500, newIntervalMs);
    if (this._timer && this._callback) {
      clearInterval(this._timer);
      this._timer = setInterval(() => {
        this._emitNext();
      }, this.intervalMs);
    }
  }

  /** Pause stream without resetting count */
  pause() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      console.info(`[TransactionStream] Paused at count ${this._count}`);
    }
  }

  /** Resume stream */
  resume() {
    if (!this._timer && this._callback) {
      this._timer = setInterval(() => {
        this._emitNext();
      }, this.intervalMs);
      console.info(`[TransactionStream] Resumed at count ${this._count}`);
    }
  }

  /** Stop stream and reset state */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._callback = null;
    this._count = 0;
    console.info("[TransactionStream] Stopped.");
  }

  get isRunning() {
    return this._timer !== null;
  }

  get count() {
    return this._count;
  }
}
