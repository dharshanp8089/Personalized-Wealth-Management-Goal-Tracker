import React, { useEffect, useState } from "react";
import api from "../services/api";

const Valuations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchValuations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/portfolio/valuation");
      setData(res.data);
    } catch (err) {
      setError("Failed to load valuations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val || 0);
  };

  if (loading && !data) return <div className="text-white p-8">Loading valuations...</div>;

  const { summary, holdings } = data || { summary: {}, holdings: [] };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Real-time Valuations</h1>
          <p className="text-slate-400 mt-1">Live market-linked value of your entire portfolio.</p>
        </div>
        <button
          onClick={fetchValuations}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-colors uppercase tracking-widest"
        >
          Refresh Prices
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Value</h3>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{formatCurrency(summary.total_current_value)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Invested</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(summary.total_cost_basis)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Profit/Loss</h3>
          <p className={`text-3xl font-bold mt-2 ${summary.total_gain_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
            {summary.total_gain_loss >= 0 ? "+" : ""}{formatCurrency(summary.total_gain_loss)}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Return %</h3>
          <p className={`text-3xl font-bold mt-2 ${summary.total_return_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
            {summary.total_return_percent?.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Avg Price</th>
                <th className="px-6 py-4 text-right">Last Price</th>
                <th className="px-6 py-4 text-right">Cost Basis</th>
                <th className="px-6 py-4 text-right">Current Value</th>
                <th className="px-6 py-4 text-right">P&L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 italic">No holdings found.</td>
                </tr>
              ) : (
                holdings.map((h) => (
                  <tr key={h.symbol} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{h.symbol}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{h.asset_type}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300 font-medium">{h.units.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(h.avg_buy_price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-cyan-400">{formatCurrency(h.last_price)}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(h.cost_basis)}</td>
                    <td className="px-6 py-4 text-right text-white font-bold">{formatCurrency(h.current_value)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${h.gain_loss_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {h.gain_loss_percent >= 0 ? "+" : ""}{h.gain_loss_percent?.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-slate-500 text-center text-xs italic">Prices are updated periodically from global market data integrations.</p>
    </div>
  );
};

export default Valuations;
