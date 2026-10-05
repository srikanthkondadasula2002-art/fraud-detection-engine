import ExpenseChart from "../components/charts/ExpenseChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import CategoryChart from "../components/charts/CategoryChart";
import SavingsChart from "../components/charts/SavingsChart";

function Analytics({ transactions }) {
  return (
    <section className="page">
      <div className="page-heading">
        <h1>Analytics</h1>
        <p>Understand your income, expenses, categories, and savings.</p>
      </div>

      <div className="analytics-grid">
        <ExpenseChart transactions={transactions} />
        <IncomeExpenseChart transactions={transactions} />
        <CategoryChart transactions={transactions} />
        <SavingsChart transactions={transactions} />
      </div>
    </section>
  );
}

export default Analytics;