import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function SavingsChart({ transactions }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = months.map((month, index) => {
    const income = transactions
      .filter((t) => t.type === "income" && new Date(t.date).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.date).getMonth() === index)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { month, savings: income - expenses };
  });

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h2>Monthly Savings</h2>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
            <Area type="monotone" dataKey="savings" stroke="#7c3aed" fill="#ede9fe" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SavingsChart;