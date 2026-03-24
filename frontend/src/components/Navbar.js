import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      <h1 className="font-bold text-lg">Wealth Tracker</h1>
      <div className="flex space-x-4 text-sm">
        <Link to="/home" className="hover:bg-blue-700 px-3 py-2 rounded transition">Home</Link>
        <Link to="/goals" className="hover:bg-blue-700 px-3 py-2 rounded transition">Goals</Link>
        <Link to="/portfolio" className="hover:bg-blue-700 px-3 py-2 rounded transition">Portfolio</Link>
        <Link to="/valuations" className="hover:bg-blue-700 px-3 py-2 rounded transition">📊 Valuations</Link>
        <Link to="/simulations" className="hover:bg-blue-700 px-3 py-2 rounded transition">🎲 Simulations</Link>
        <Link to="/calculators" className="hover:bg-blue-700 px-3 py-2 rounded transition">🧮 Calculators</Link>
        <Link to="/recommendations" className="hover:bg-blue-700 px-3 py-2 rounded transition">💡 Recommendations</Link>
        <Link to="/profile" className="hover:bg-blue-700 px-3 py-2 rounded transition">👤 Profile & KYC</Link>
      </div>
    </nav>
  );
}
