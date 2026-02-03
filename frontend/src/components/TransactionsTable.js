function TransactionsTable() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        Transaction History
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-gray-600">
            <th className="text-left py-2">Type</th>
            <th>Units</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b hover:bg-gray-50">
            <td className="py-2 text-green-600 font-semibold">BUY</td>
            <td>10</td>
            <td>₹500</td>
            <td>₹5,000</td>
          </tr>

          <tr className="border-b hover:bg-gray-50">
            <td className="py-2 text-red-600 font-semibold">SELL</td>
            <td>5</td>
            <td>₹550</td>
            <td>₹2,750</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TransactionsTable;
