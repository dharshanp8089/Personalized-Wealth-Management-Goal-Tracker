import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Goals", path: "/goals" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Calculators", path: "/calculators" },
    { name: "Simulations", path: "/simulations" },
    { name: "Recommendations", path: "/recommendations" },
    { name: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white tracking-tight">
            Wealth<span className="text-cyan-400">Tracker</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path ? "text-cyan-400" : "text-slate-400 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm hidden sm:block">
              {user?.name || "User"} 
              <span className="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 border border-slate-700">
                {user?.risk_profile?.toUpperCase() || "UNSET"}
              </span>
            </span>
            <button
              onClick={logout}
              className="bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
