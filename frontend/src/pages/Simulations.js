import React, { useEffect, useState } from "react";
import api from "../services/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Simulations = () => {
  const [goals, setGoals] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [gRes, sRes] = await Promise.all([
        api.get("/goals"),
        api.get("/simulations")
      ]);
      setGoals(gRes.data);
      setSimulations(sRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0).replace("INR", "₹");
  };

  const runSimulation = async () => {
    if (!selectedGoal) return;
    setRunning(true);
    setError("");
    try {
      const res = await api.post(`/goals/${selectedGoal}/simulate`);
      // The backend returns { id, success_rate, results: { ... } }
      setResult(res.data.results || res.data);
      fetchData();
    } catch (err) {
      setError("Simulation failed");
    } finally {
      setRunning(false);
    }
  };

  if (loading && goals.length === 0) return <div className="text-white p-12 animate-pulse text-lg">Loading simulation engine...</div>;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter">Monte Carlo Simulations</h1>
        <p className="text-slate-400 mt-2 text-lg">Probability-based wealth projections using market volatility.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Project Goal</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold appearance-none"
                  value={selectedGoal || ""}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                >
                  <option value="">Select a goal to analyze...</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <button
                onClick={runSimulation}
                disabled={!selectedGoal || running}
                className="w-full bg-cyan-400 text-slate-900 py-4 rounded-2xl font-black hover:bg-cyan-300 transition-all uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-cyan-900/20"
              >
                {running ? "Analyzing Market Data..." : "Run Probability Engine"}
              </button>
              {error && <p className="text-rose-400 text-xs font-bold text-center">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
            <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest">Recent Scenarios</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {simulations.length === 0 && <p className="text-slate-600 font-medium italic">No simulation history found.</p>}
              {simulations.map(s => (
                <div 
                  key={s.id} 
                  className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  onClick={() => setResult(s.results)}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-white text-sm font-black">Scenario #{s.id}</p>
                    <span className="text-cyan-400 text-xs font-black">{s.results?.success_rate}% Success</span>
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase font-black mt-2 tracking-widest">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-2">
          {result ? (
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-800/30 rounded-[2rem] border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl font-black">Success</div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Probability of Completion</p>
                  <p className={`text-6xl font-black ${result.success_rate >= 80 ? "text-cyan-400" : result.success_rate >= 50 ? "text-yellow-400" : "text-rose-400"}`}>
                    {result.success_rate}%
                  </p>
                </div>
                <div className="p-8 bg-slate-800/30 rounded-[2rem] border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl font-black">Median</div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Median Projection</p>
                  <p className="text-5xl font-black text-white">
                    {formatCurrency(result.median_projection || result.median_final || 0)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-xl font-black tracking-tight">Growth Projection</h3>
                  <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Horizon: {result.months_left || "N/A"} Months</span>
                  </div>
                </div>
                
                <div className="h-[300px] w-full bg-slate-800/20 rounded-[2rem] border border-slate-800/50 p-6">
                  {result.chart_data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.chart_data}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="period" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                          itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                          labelStyle={{ color: '#64748b' }}
                          formatter={(val) => formatCurrency(val)}
                        />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : result.projections ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.projections[0].map((val, i) => ({ month: i, value: val }))}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                          itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                          labelStyle={{ color: '#64748b' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center italic text-slate-600">Visualizing projection...</div>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-cyan-900/10 border border-cyan-500/20 rounded-3xl flex items-center space-x-6">
                <div className="h-12 w-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-2xl">💡</div>
                <p className="text-cyan-100 text-sm font-medium leading-relaxed">
                  {result.success_rate >= 80 
                    ? "Confidence is high. Your strategy is well-insulated against market median volatility. Maintain current contributions." 
                    : "Low probability detected. We recommend increasing your monthly liquidity allocation or shifting to a slightly more aggressive stance if time permits."}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-900/30 border-4 border-dashed border-slate-800 rounded-[3rem] flex items-center justify-center p-20 text-center animate-in fade-in zoom-in">
              <div className="max-w-md">
                <div className="h-24 w-24 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <span className="text-5xl animate-bounce">🔮</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Awaiting Signal</h3>
                <p className="text-slate-500 text-lg">Select a financial milestone and ignite the probability engine to visualize your future wealth path.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Simulations;
