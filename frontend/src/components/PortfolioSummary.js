function PortfolioSummary() {
  return (
    <div className="bg-white p-6 rounded shadow flex justify-between">
      <div>
        <p className="text-gray-500">
          Total Portfolio Value
        </p>
        <h2 className="text-3xl font-bold text-blue-600">
          ₹2,25,000
        </h2>
      </div>

      <div className="text-right">
        <p className="text-gray-500">
          Investments
        </p>
        <p className="text-lg font-semibold">
          2 Assets
        </p>
      </div>
    </div>
  );
}

export default PortfolioSummary;
