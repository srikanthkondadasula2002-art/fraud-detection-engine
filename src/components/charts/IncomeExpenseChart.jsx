import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function IncomeExpenseChart({ transactions }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = months.map((month, index) => ({
    month,
    income: transactions
      .filter((t) => t.type === "income" && new Date(t.date).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    expenses: transactions
      .filter((t) => t.type === "expense" && new Date(t.date).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }));

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h2>Income vs Expenses</h2>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;