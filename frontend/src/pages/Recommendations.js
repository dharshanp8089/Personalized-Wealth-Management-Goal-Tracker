import React, { useEffect, useState } from "react";
import api from "../services/api";

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/recommendations");
      setRecommendations(res.data);
    } catch (err) {
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const generateRec = async (type) => {
    try {
      setGenerating(true);
      const endpoint = type === "allocate" ? "/recommendations/allocate" : "/recommendations/rebalance";
      await api.post(endpoint);
      fetchRecommendations();
    } catch (err) {
      setError("Generation failed. Make sure you have a risk profile and some assets.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading && recommendations.length === 0) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Tailored Advice</h1>
          <p className="text-slate-400 mt-1">Smart strategies for your portfolio optimization.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => generateRec("allocate")}
            disabled={generating}
            className="bg-cyan-400 text-slate-900 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-300 transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            {generating ? "..." : "Generate Allocation"}
          </button>
          <button
            onClick={() => generateRec("rebalance")}
            disabled={generating}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            {generating ? "..." : "Check Rebalance"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

      <div className="grid grid-cols-1 gap-6">
        {recommendations.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-16 text-center">
            <p className="text-slate-500">No recommendations found. Generate one above!</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl">
                    {rec.title.includes("Rebalance") ? "⚖️" : "🎯"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{rec.title}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-slate-300 leading-relaxed">{rec.text}</p>

              {rec.suggested_allocation && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Suggested Actions</h4>
                  {rec.suggested_allocation.allocation ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(rec.suggested_allocation.allocation).map(([asset, weight]) => (
                        <div key={asset} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                          <p className="text-slate-500 text-[10px] uppercase font-bold">{asset}</p>
                          <p className="text-xl font-bold text-white mt-1">{weight}%</p>
                        </div>
                      ))}
                    </div>
                  ) : rec.suggested_allocation.suggestions && (
                    <div className="space-y-3">
                      {rec.suggested_allocation.suggestions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700">
                          <div className="flex items-center space-x-3">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${s.action === "REDUCE" ? "bg-red-400/10 text-red-400" : "bg-green-400/10 text-green-400"}`}>
                              {s.action}
                            </span>
                            <span className="font-bold text-white">{s.symbol}</span>
                          </div>
                          <span className="text-xs text-slate-400">{s.reason}</span>
                        </div>
                      ))}
                      {rec.suggested_allocation.suggestions.length === 0 && <p className="text-slate-500 italic text-sm">Portfolio is well balanced.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Recommendations;
