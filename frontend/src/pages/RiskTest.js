import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const questions = [
  { id: "horizon", q: "What is your investment time horizon?", options: [{ text: "Less than 3 years", val: "short" }, { text: "3 – 7 years", val: "medium" }, { text: "7+ years", val: "long" }] },
  { id: "reaction", q: "How would you react if your portfolio drops 20% in a month?", options: [{ text: "Sell everything", val: "panic" }, { text: "Do nothing / Wait", val: "hold" }, { text: "Buy more", val: "opportunistic" }] },
  { id: "goal", q: "What is your primary investment goal?", options: [{ text: "Capital preservation", val: "safety" }, { text: "Moderate growth", val: "balanced" }, { text: "Aggressive wealth creation", val: "growth" }] },
  { id: "income", q: "How stable is your current source of income?", options: [{ text: "Unpredictable", val: "low" }, { text: "Stable salary", val: "stable" }, { text: "High surplus / Multiple streams", val: "high" }] },
  { id: "experience", q: "How would you rate your investment knowledge?", options: [{ text: "Beginner", val: "novice" }, { text: "Intermediate", val: "informed" }, { text: "Professional / Expert", val: "expert" }] },
];

const RiskTest = () => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // We'll use this to refresh user via /me later or just manual refresh
  const navigate = useNavigate();

  const handleAnswer = async (val) => {
    const newAnswers = { ...answers, [questions[current].id]: val };
    setAnswers(newAnswers);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setLoading(true);
      try {
        await api.post("/risk-profile", { answers: newAnswers });
        // Instead of re-logging in, we just redirect and let the App refresh user or just rely on the API
        navigate("/risk-result");
      } catch (err) {
        console.error("Failed to save risk profile", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const currentQ = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (loading) return <div className="text-white">Calculating your profile...</div>;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase mt-3 tracking-widest">Question {current + 1} of {questions.length}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 leading-tight">{currentQ.q}</h2>
        <div className="space-y-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt.val)}
              className="w-full text-left p-5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-cyan-500/50 hover:text-white transition-all group flex items-center justify-between"
            >
              <span className="font-medium">{opt.text}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskTest;
