import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between">
      <h1 className="font-bold text-lg">Wealth Tracker</h1>
      <div className="space-x-4">
        <Link to="/home">Home</Link>
        <Link to="/goals">Goals</Link>
        <Link to="/portfolio">Portfolio</Link>
      </div>
    </nav>
  );
}
