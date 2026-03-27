import React, { useEffect, useState } from "react";
import api from "../services/api";
import BuySellModal from "../components/BuySellModal";
import TransactionsTable from "../components/TransactionsTable";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const Portfolio = () => {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("buy");
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  const COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#fbbf24", "#34d399"];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [portfolioRes, summaryRes] = await Promise.all([
        api.get("/portfolio"),
        api.get("/portfolio/summary")
      ]);
      setHoldings(portfolioRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAllocationData = () => {
    const map = {};
    holdings.forEach(h => {
      const type = h.asset_type.toUpperCase();
      map[type] = (map[type] || 0) + (h.units * h.last_price);
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0).replace("INR", "₹");
  };

  if (loading && !summary) return <div className="text-white p-8 animate-pulse text-lg font-black tracking-tighter">Aggregating assets...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Global Portfolio</h1>
          <p className="text-slate-500 mt-2 text-xl font-medium">Real-time valuation and asset distribution.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openModal("buy")}
            className="bg-cyan-400 text-slate-900 px-8 py-3.5 rounded-[1.5rem] text-xs font-black hover:bg-cyan-300 transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/20"
          >
            Deploy Capital
          </button>
          <button
            onClick={() => openModal("sell")}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-[1.5rem] text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-widest border border-slate-800 shadow-xl"
            disabled={holdings.length === 0}
          >
            Liquidate
          </button>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Cost Basis</h3>
            <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(summary.total_cost_basis)}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl border-b-4 border-b-cyan-500/50">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Market Value</h3>
            <p className="text-4xl font-black text-cyan-400 tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(summary.total_current_value)}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Portfolio P/L</h3>
            {(() => {
              const diff = summary.total_current_value - summary.total_cost_basis;
              const percent = summary.total_cost_basis > 0 ? (diff / summary.total_cost_basis) * 100 : 0;
              return (
                <div>
                  <p className={`text-4xl font-black tracking-tighter ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                  </p>
                  <p className={`text-xs font-black mt-2 uppercase tracking-widest ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {diff >= 0 ? "↑" : "↓"} {Math.abs(percent).toFixed(2)}% Performance
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-10 tracking-tight uppercase tracking-widest">Asset Allocation</h2>
          <div className="h-[300px] w-full relative">
            {holdings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getAllocationData()}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {getAllocationData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-slate-700">No assets detected</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Diversification</span>
              <span className="text-lg font-black text-white">{getAllocationData().length} Classes</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {getAllocationData().map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center bg-slate-800/20 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-black text-white uppercase tracking-tighter">{entry.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-500">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h2 className="text-xl font-black text-white tracking-tight">Active Positions</h2>
            <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{holdings.length} Assets</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-widest font-black">
                <tr>
                  <th className="px-8 py-5">Instrument</th>
                  <th className="px-8 py-5 text-right">Liquidity</th>
                  <th className="px-8 py-5 text-right">Avg Price</th>
                  <th className="px-8 py-5 text-right">Current</th>
                  <th className="px-8 py-5 text-right font-bold text-cyan-400">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-600 font-bold italic">
                      Zero positions active. Deploy capital to begin tracking.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h) => {
                    const profit = (h.units * h.last_price) - h.cost_basis;
                    const profitPercent = (profit / h.cost_basis) * 100;
                    return (
                      <tr key={h.symbol} className="hover:bg-cyan-400/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{h.symbol}</div>
                          <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1">{h.asset_type}</div>
                        </td>
                        <td className="px-8 py-6 text-right text-slate-300 font-black">
                          {h.units.toFixed(4)}
                        </td>
                        <td className="px-8 py-6 text-right text-slate-400 font-medium">
                          {formatCurrency(h.avg_buy_price)}
                        </td>
                        <td className="px-8 py-6 text-right text-slate-200 font-bold">
                          {formatCurrency(h.last_price)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="font-black text-white">{formatCurrency(h.units * h.last_price)}</div>
                          <div className={`text-[10px] font-black mt-1 ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {profit >= 0 ? "▲" : "▼"}{Math.abs(profitPercent).toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransactionsTable />

      {showModal && (
        <BuySellModal
          type={modalType}
          close={() => setShowModal(false)}
          refresh={fetchData}
        />
      )}
    </div>
  );
};

export default Portfolio;
