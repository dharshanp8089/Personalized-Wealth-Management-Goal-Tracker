import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ summary: null, goals: [], recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Plausible mock history data for visualization
  const [history] = useState([
    { name: "Jan", value: 45000 },
    { name: "Feb", value: 52000 },
    { name: "Mar", value: 48000 },
    { name: "Apr", value: 61000 },
    { name: "May", value: 59000 },
    { name: "Jun", value: 72000 },
  ]);

  const fetchDashboard = async () => {
    try {
      const [sumRes, goalsRes, recsRes] = await Promise.all([
        api.get("/portfolio/summary"),
        api.get("/goals"),
        api.get("/recommendations")
      ]);
      setData({
        summary: sumRes.data,
        goals: goalsRes.data,
        recommendations: recsRes.data
      });
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const syncMarket = async () => {
    setSyncing(true);
    try {
      await api.post("/market/sync");
      await fetchDashboard();
    } catch (err) {
      console.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const exportPortfolio = async () => {
    try {
      const res = await api.get("/portfolio/export/csv", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'portfolio.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const exportPortfolioPdf = async () => {
    try {
      const res = await api.get("/portfolio/export/pdf", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'portfolio.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0).replace("INR", "₹");
  };

  if (loading) return <div className="text-white p-8 animate-pulse text-lg font-black tracking-tighter">Initializing wealth engine...</div>;

  const topGoal = data.goals[0];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter">
            Welcome, <span className="text-cyan-400">{user?.name?.split(" ")[0] || "Strategist"}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-xl font-medium">Your global wealth portfolio is under management.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportPortfolioPdf}
            className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-xl hover:border-red-500/50 transition-all text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            PDF Report
          </button>
          <button
            onClick={exportPortfolio}
            className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-xl hover:border-cyan-500/50 transition-all text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            CSV Report
          </button>
          <button 
            onClick={syncMarket}
            disabled={syncing}
            className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-xl hover:border-cyan-500/50 transition-all group"
          >
            <div className={`h-2 w-2 rounded-full ${syncing ? "bg-cyan-400 animate-ping" : "bg-green-500 animate-pulse"}`}></div>
            <span className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
              {syncing ? "Syncing..." : "Sync Market Feed"}
            </span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform text-8xl">📈</div>
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Total Net Worth</h3>
          <p className="text-5xl font-black text-white tracking-tighter">{formatCurrency(data.summary?.total_current_value)}</p>
          <div className="mt-8 flex items-center space-x-3">
            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">+12.4%</span>
            <span className="text-slate-600 font-bold text-xs uppercase">trailing 30d</span>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform text-8xl">🎯</div>
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Milestones Active</h3>
          <p className="text-5xl font-black text-white tracking-tighter">{data.goals.length}</p>
          <div className="mt-8">
            <Link to="/goals" className="text-cyan-400 text-[10px] font-black hover:text-cyan-300 transition-colors uppercase tracking-[0.15em] py-2 border-b-2 border-cyan-400/20 hover:border-cyan-400">Launch Goals →</Link>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform text-8xl">🛡️</div>
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Risk Tolerance</h3>
          <p className={`text-5xl font-black tracking-tighter ${user?.risk_profile === "Aggressive" ? "text-rose-400" : user?.risk_profile === "Moderate" ? "text-amber-400" : "text-emerald-400"}`}>
            {user?.risk_profile || "NOT SET"}
          </p>
          <div className="mt-8">
            <Link to="/risk-test" className="text-cyan-400 text-[10px] font-black hover:text-cyan-300 transition-colors uppercase tracking-[0.15em] py-2 border-b-2 border-cyan-400/20 hover:border-cyan-400">Recalibrate Model →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8 bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-white tracking-tight">Wealth Trajectory</h2>
            <div className="flex space-x-2">
              {["1M", "3M", "6M", "YTD", "ALL"].map(t => (
                <button key={t} className={`px-3 py-1 rounded-lg text-[9px] font-black ${t === "6M" ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-500"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} dy={15} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#22d3ee', fontWeight: '900', fontSize: '14px' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorNetWorth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-4 space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl">
            <h2 className="text-xl font-black text-white mb-8 tracking-tight">Primary Goal</h2>
            {topGoal ? (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-lg font-black text-white">{topGoal.title}</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Target: {formatCurrency(topGoal.target_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-cyan-400">
                      {((topGoal.current_amount / topGoal.target_amount) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-1000" 
                    style={{ width: `${(topGoal.current_amount / topGoal.target_amount) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <span>{formatCurrency(topGoal.current_amount)} Capitalized</span>
                  <span>{formatCurrency(topGoal.target_amount - topGoal.current_amount)} deficit</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-600 mb-8 font-bold italic">No milestones in focus.</p>
                <Link to="/goals" className="bg-cyan-400 text-slate-900 px-8 py-3 rounded-2xl font-black hover:bg-cyan-300 transition-all uppercase tracking-widest text-xs shadow-lg shadow-cyan-900/20">Initialize Goal</Link>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl font-black italic">Insights</div>
            <h2 className="text-xl font-black text-white mb-8 tracking-tight">AI Strategy</h2>
            {data.recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-cyan-400">
                  <h4 className="font-black text-white text-sm mb-2 uppercase tracking-tight">{data.recommendations[0].title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-medium">{data.recommendations[0].text}</p>
                  <Link to="/recommendations" className="inline-block mt-4 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-cyan-300 transition-colors border-b border-cyan-400/20">Full Intelligence Report →</Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-600 font-bold italic mb-6">Insufficient data for AI calibration.</p>
                <Link to="/risk-test" className="text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-400/20">Complete Profile →</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
