import React, { useEffect, useState } from "react";
import api from "../services/api";

const BuySellModal = ({ type, close, refresh }) => {
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    symbol: "",
    asset_type: "stock",
    quantity: "",
    price: "",
    fees: "0",
    goal_id: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get("/goals");
        setGoals(res.data);
      } catch (err) {
        console.error("Failed to fetch goals");
      }
    };
    fetchGoals();
  }, []);

  const calculateTotal = () => {
    const q = parseFloat(formData.quantity) || 0;
    const p = parseFloat(formData.price) || 0;
    const f = parseFloat(formData.fees) || 0;
    const total = q * p + (type === "buy" ? f : -f);
    return isNaN(total) ? "0.00" : total.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = type === "buy" ? "/portfolio/buy" : "/portfolio/sell";
      await api.post(endpoint, {
        symbol: formData.symbol.toUpperCase(),
        asset_type: formData.asset_type,
        units: parseFloat(formData.quantity),
        price_per_unit: parseFloat(formData.price),
        fees: parseFloat(formData.fees),
        goal_id: formData.goal_id ? parseInt(formData.goal_id) : null
      });
      refresh();
      close();
    } catch (err) {
      setError(err.response?.data?.detail || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">
          <span className={type === "buy" ? "text-cyan-400" : "text-rose-400"}>
            {type === "buy" ? "Invest Capital" : "Liquidate Asset"}
          </span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm font-medium">{Array.isArray(error) ? error[0].msg : typeof error === 'string' ? error : JSON.stringify(error)}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Symbol</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold placeholder-slate-600"
                placeholder="AAPL"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Asset Type</label>
              <select
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold appearance-none"
                value={formData.asset_type}
                onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                disabled={loading}
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="bond">Bond</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          {type === "buy" && (
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Link to Goal (Optional)</label>
              <select
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold appearance-none"
                value={formData.goal_id}
                onChange={(e) => setFormData({...formData, goal_id: e.target.value})}
                disabled={loading}
              >
                <option value="">No Goal linked</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Quantity</label>
              <input
                type="number"
                required
                step="0.0001"
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold"
                placeholder="10.0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Price (₹)</label>
              <input
                type="number"
                required
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold"
                placeholder="150.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-slate-800/30 p-5 rounded-[1.5rem] border border-slate-800 text-center">
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Transaction Total</p>
            <p className="text-3xl font-black text-white mt-1">₹{calculateTotal()}</p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={close}
              className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-xs shadow-lg ${
                type === "buy" ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300 shadow-cyan-900/20" : "bg-rose-500 text-white hover:bg-rose-400 shadow-rose-900/20"
              }`}
              disabled={loading}
            >
              {loading ? "Processing..." : type === "buy" ? "Execute Buy" : "Execute Sell"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuySellModal;
