import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#64748b"];

function CategoryChart({ transactions }) {
  const map = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });

  const data = Object.entries(map).map(([name, value]) => ({ name, value }));

  return (
    <div className="card chart-card">
      <div className="card-header">
        <h2>Spending by Category</h2>
      </div>
      <div className="chart-wrap">
        {data.length === 0 ? (
          <div className="empty">No expense data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default CategoryChart;