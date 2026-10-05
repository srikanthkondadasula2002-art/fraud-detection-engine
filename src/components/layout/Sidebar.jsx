import { BarChart3, LayoutDashboard, Receipt, ShieldAlert, Wallet, X } from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "budgets", label: "Budgets", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "fraud", label: "Fraud Radar", icon: ShieldAlert, badge: "Live" }
];

function Sidebar({ activePage, onNavigate, open, onClose }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">F</div>
        <div className="brand-name">FinSight</div>
        <button
          className="mobile-menu-button"
          style={{ marginLeft: "auto", color: "#fff" }}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="nav-list">
        {items.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            className={`nav-button ${activePage === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
            {badge && <span className="nav-item-badge">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        FinSight v1.0<br />
        Personal Finance Tracker
      </div>
    </aside>
  );
}

export default Sidebar;