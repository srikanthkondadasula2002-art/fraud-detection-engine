import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`mobile-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <Navbar
          activePage={activePage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {children}
      </main>
    </div>
  );
}

export default Layout;