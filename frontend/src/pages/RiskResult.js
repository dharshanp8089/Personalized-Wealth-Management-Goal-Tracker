import { useNavigate } from "react-router-dom";

export default function RiskResult() {
  const risk = localStorage.getItem("risk_profile");
  const navigate = useNavigate();

  const color =
    risk === "Aggressive"
      ? "text-red-600"
      : risk === "Moderate"
      ? "text-yellow-600"
      : "text-green-600";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-2">Your Risk Profile</h1>
      <p className={`text-2xl font-semibold mb-6 ${color}`}>{risk}</p>

      <button
        className="btn w-64"
        onClick={() => navigate("/home")}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
