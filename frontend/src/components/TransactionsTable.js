import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const TransactionsTable = ({ symbol = null }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  const exportTransactions = async () => {
    try {
      const res = await api.get("/portfolio/transactions/export/csv" + (symbol ? `?symbol=${symbol}` : ""), { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions${symbol ? '_'+symbol : ''}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const endpoint = symbol ? `/portfolio/${symbol}/transactions` : "/portfolio/transactions";
      const res = await api.get(endpoint);
      setTransactions(res.data);
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0).replace("INR", "₹");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {symbol ? `${symbol} History` : "Transaction History"}
        </h2>
        <div className="flex space-x-4">
          <button 
            onClick={exportTransactions}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
          >
            Export CSV
          </button>
          <button 
            onClick={fetchTransactions}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Symbol / Type</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Fees</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 animate-pulse italic">
                  Loading history...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 italic">
                  No transactions recorded.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const total = (txn.quantity * txn.price) + (txn.transaction_type === "buy" ? txn.fees : -txn.fees);
                return (
                  <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{txn.symbol}</div>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        txn.transaction_type === "buy" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300 font-medium">
                      {txn.quantity.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {formatCurrency(txn.price)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 italic">
                      {formatCurrency(txn.fees)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 text-xs">
                      {formatDate(txn.executed_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
