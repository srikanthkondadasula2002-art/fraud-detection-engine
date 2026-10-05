import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function ExpenseChart({ transactions }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = months.map((month, index) => ({
    month,
    expenses: transactions
      .filter((t) => t.type === "expense" && new Date(t.date).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }));

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h2>Monthly Expenses</h2>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
            <Bar dataKey="expenses" fill="#2563eb" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ExpenseChart;