import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RiskResult = () => {
  const { user } = useAuth();

  const getRiskColor = (risk) => {
    const r = risk?.toLowerCase();
    if (r === "aggressive") return "text-red-400";
    if (r === "moderate") return "text-yellow-400";
    return "text-green-400";
  };

  const getRiskDescription = (risk) => {
    const r = risk?.toLowerCase();
    if (r === "aggressive") return "You prioritize high returns and are willing to withstand significant market volatility.";
    if (r === "moderate") return "You seek a balance between growth and capital preservation.";
    return "You prioritize stability and capital protection over high returns.";
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl shadow-2xl">
        <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          📊
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Your Risk Profile</h1>
        <p className={`text-5xl font-extrabold mb-6 tracking-tighter ${getRiskColor(user.risk_profile)}`}>
          {user.risk_profile || "NOT SET"}
        </p>
        
        <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          {getRiskDescription(user.risk_profile)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/"
            className="bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 transition-colors uppercase tracking-widest text-sm border border-slate-700"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/recommendations"
            className="bg-cyan-400 text-slate-900 py-4 rounded-2xl font-bold hover:bg-cyan-300 transition-colors uppercase tracking-widest text-sm"
          >
            Get Recommendations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RiskResult;
