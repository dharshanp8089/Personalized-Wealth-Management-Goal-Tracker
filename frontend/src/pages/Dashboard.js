export default function Dashboard() {
  const risk = localStorage.getItem("risk_profile");

  const allocation = {
    Conservative: { Equity: 20, Debt: 70, Gold: 10 },
    Moderate: { Equity: 50, Debt: 30, Gold: 20 },
    Aggressive: { Equity: 70, Debt: 20, Crypto: 10 },
  };

  const data = allocation[risk];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="mb-6 text-gray-600">
        Risk Profile: <b>{risk}</b>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="bg-white p-6 rounded shadow text-center"
          >
            <h2 className="text-lg font-semibold">{key}</h2>
            <p className="text-2xl text-blue-600 font-bold">{value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
