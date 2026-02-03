export default function HoldingsTable({ holdings }) {
  return (
    <table className="w-full bg-white shadow rounded">
      <thead>
        <tr>
          <th className="p-2">Asset</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map(h => (
          <tr key={h.id} className="text-center">
            <td className="p-2">{h.symbol}</td>
            <td>{h.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
