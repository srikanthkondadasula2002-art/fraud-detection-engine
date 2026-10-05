import { Menu } from "lucide-react";

const titles = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  budgets: "Budgets",
  analytics: "Analytics",
  fraud: "Streaming Fraud Radar"
};

function Navbar({ activePage, onMenuClick }) {
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="mobile-menu-button" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="nav-title">{titles[activePage] || "FinSight"}</div>
      </div>

      <div className="profile">
        <div>
          <strong>Srikanth</strong>
          <div style={{ fontSize: 12, color: "#7b8495" }}>Personal Account</div>
        </div>
        <div className="avatar">S</div>
      </div>
    </header>
  );
}

export default Navbar;