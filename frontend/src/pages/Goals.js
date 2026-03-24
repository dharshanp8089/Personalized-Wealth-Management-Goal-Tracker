import React, { useEffect, useState } from "react";
import api from "../services/api";

const GoalCard = ({ goal, onDelete }) => {
  const [metrics, setMetrics] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0).replace("INR", "₹");
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get(`/goals/${goal.id}/metrics`);
        setMetrics(res.data);
      } catch (err) {
        console.error("Failed to fetch metrics for goal", goal.id);
      }
    };
    fetchMetrics();
  }, [goal.id]);

  if (!metrics) return (
    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 animate-pulse h-40"></div>
  );

  const pct = Math.min(metrics.completion_percentage || 0, 100).toFixed(0);

  return (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl transition-all hover:shadow-cyan-900/10 group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl shadow-inner">
            {goal.goal_type === "home" ? "🏠" : goal.goal_type === "retirement" ? "🏝️" : goal.goal_type === "education" ? "🎓" : "🎯"}
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{goal.title}</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Deadline: {new Date(goal.target_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onDelete(goal.id)}
          className="bg-slate-800 p-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
        >
          🗑️
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Progress</p>
            <p className="text-2xl font-black text-white">{formatCurrency(metrics.current_amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Target</p>
            <p className="text-xl font-bold text-slate-400">{formatCurrency(metrics.target_amount)}</p>
          </div>
        </div>

        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000"
            style={{ width: `${pct}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>{pct}% Achieved</span>
          <span>{metrics.duration_months} Months Left</span>
        </div>

        {metrics.linked_assets?.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Linked Assets</p>
            <div className="flex flex-wrap gap-2">
              {metrics.linked_assets.map(symbol => (
                <span key={symbol} className="px-3 py-1 bg-slate-800 text-cyan-400 rounded-lg text-xs font-bold border border-slate-700">
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    goal_type: "custom",
    target_amount: "",
    target_date: "",
    monthly_contribution: ""
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (err) {
      console.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/goals", {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        monthly_contribution: parseFloat(formData.monthly_contribution || 0)
      });
      setFormData({ title: "", goal_type: "custom", target_amount: "", target_date: "", monthly_contribution: "" });
      fetchGoals();
    } catch (err) {
      setError("Failed to add goal. Please try again.");
    }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      console.error("Delete failed");
    }
  };

  if (loading && goals.length === 0) return <div className="text-white p-8 animate-pulse text-lg">Loading your milestones...</div>;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter">Your Milestones</h1>
        <p className="text-slate-400 mt-2 text-lg">Define your future and track your path to wealth.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl sticky top-8">
            <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Create New Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <p className="text-rose-400 text-sm font-bold">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                  placeholder="e.g. Retirement Fund"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Goal Type</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold appearance-none"
                  value={formData.goal_type}
                  onChange={(e) => setFormData({...formData, goal_type: e.target.value})}
                >
                  <option value="retirement">Retirement</option>
                  <option value="home">Property/Home</option>
                  <option value="education">Education</option>
                  <option value="custom">Custom Milestone</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                    placeholder="100,000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Deadline</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-400 text-slate-900 py-4 rounded-2xl font-black hover:bg-cyan-300 transition-all uppercase tracking-widest mt-4 shadow-lg shadow-cyan-900/20"
              >
                Launch Goal
              </button>
            </form>
          </div>
        </aside>

        <section className="lg:col-span-2 space-y-8">
          {goals.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[3rem] p-20 text-center">
              <div className="text-6xl mb-6 opacity-20">🏁</div>
              <p className="text-slate-500 text-lg font-medium">Your financial roadmap is empty. <br/>Start by defining your first big milestone.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Goals;
