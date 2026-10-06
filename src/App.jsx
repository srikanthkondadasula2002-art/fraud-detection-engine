import { useEffect, useMemo, useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Analytics from "./pages/Analytics";
import FraudMonitor from "./pages/FraudMonitor";
import { useFraudModel } from "./fraud/useFraudModel";
import { useTransactionStream } from "./fraud/useTransactionStream";

const initialTransactions = [
  { id: 1, description: "Monthly Salary", category: "Salary", type: "income", amount: 50000, date: "2026-10-01" },
  { id: 2, description: "House Rent", category: "Housing", type: "expense", amount: 12000, date: "2026-10-02" },
  { id: 3, description: "Groceries", category: "Food", type: "expense", amount: 3500, date: "2026-10-03" },
  { id: 4, description: "Freelance Project", category: "Freelance", type: "income", amount: 10000, date: "2026-10-04" },
  { id: 5, description: "Metro & Bus", category: "Transport", type: "expense", amount: 1800, date: "2026-10-04" },
  { id: 6, description: "Movie", category: "Entertainment", type: "expense", amount: 900, date: "2026-10-04" }
];

const initialBudgets = [
  { id: 1, category: "Food", limit: 6000 },
  { id: 2, category: "Housing", limit: 15000 },
  { id: 3, category: "Transport", limit: 4000 },
  { id: 4, category: "Entertainment", limit: 3000 }
];

function App() {
  // ── Fraud Prediction Pipeline ─ Commit 1 & 3: Model and Anomaly Scoring ──
  const { model, scoreTransaction, scoreBatch, loading: modelLoading, error: modelError } = useFraudModel();

  // ── Fraud Prediction Pipeline ─ Commit 2: Apply model on streaming transactions ──
  const streamState = useTransactionStream({
    scoreTransaction,
    onNewTransaction: (newTx) => {
      setTransactions((current) => [
        { ...newTx, id: newTx.id || Date.now(), amount: Number(newTx.amount) },
        ...current
      ]);
    },
    intervalMs: 2500,
    autoStart: false,
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [transactions, setTransactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("finsight_transactions")) || initialTransactions;
    } catch {
      return initialTransactions;
    }
  });
  const [budgets, setBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("finsight_budgets")) || initialBudgets;
    } catch {
      return initialBudgets;
    }
  });

  useEffect(() => {
    localStorage.setItem("finsight_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("finsight_budgets", JSON.stringify(budgets));
  }, [budgets]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      savingsRate: income ? ((income - expenses) / income) * 100 : 0
    };
  }, [transactions]);

  /**
   * Transactions annotated with fraud scores.
   * Each entry gains a `fraud` field: { score: number, risk: { level, label, color } }
   * Falls back to null when the model is still loading.
   */
  const scoredTransactions = useMemo(() => {
    return transactions.map((t) => ({
      ...t,
      fraud: scoreTransaction ? scoreTransaction(t) : null,
    }));
  }, [transactions, scoreTransaction]);

  const addTransaction = (transaction) => {
    setTransactions((current) => [
      { ...transaction, id: Date.now(), amount: Number(transaction.amount) },
      ...current
    ]);
  };

  const updateTransaction = (updated) => {
    setTransactions((current) =>
      current.map((t) => (t.id === updated.id ? { ...updated, amount: Number(updated.amount) } : t))
    );
  };

  const deleteTransaction = (id) => {
    setTransactions((current) => current.filter((t) => t.id !== id));
  };

  const addBudget = (budget) => {
    setBudgets((current) => [
      ...current,
      { ...budget, id: Date.now(), limit: Number(budget.limit) }
    ]);
  };

  const deleteBudget = (id) => {
    setBudgets((current) => current.filter((b) => b.id !== id));
  };

  const renderPage = () => {
    const common = {
      transactions: scoredTransactions,
      budgets,
      totals,
      onNavigate: setActivePage,
      model,
      scoreBatch,
      modelLoading,
      modelError,
      streamState,
    };

    switch (activePage) {
      case "transactions":
        return (
          <Transactions
            {...common}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        );
      case "budgets":
        return (
          <Budgets
            {...common}
            onAdd={addBudget}
            onDelete={deleteBudget}
          />
        );
      case "analytics":
        return <Analytics {...common} />;
      case "fraud":
        return (
          <FraudMonitor
            {...common}
            streamState={streamState}
          />
        );
      default:
        return <Dashboard {...common} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default App;