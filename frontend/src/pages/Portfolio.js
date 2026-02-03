import { useEffect, useState } from "react";
import api from "../services/api";
import BuySellModal from "../components/BuySellModal";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("buy"); // buy | sell
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio");

      // 🔒 SAFETY: ensure array
      if (Array.isArray(res.data)) {
        setHoldings(res.data);
      } else {
        setHoldings([]);
      }
    } catch (err) {
      console.error("Portfolio fetch failed", err);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const openBuy = () => {
    setModalType("buy");
    setShowModal(true);
  };

  const openSell = () => {
    setModalType("sell");
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={openBuy}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Buy Asset
        </button>

        <button
          onClick={openSell}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          disabled={holdings.length === 0}
        >
          Sell Asset
        </button>
      </div>

      {/* HOLDINGS TABLE */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Asset</th>
              <th className="p-3 text-center">Quantity</th>
              <th className="p-3 text-center">Avg Price (₹)</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">
                  Loading portfolio...
                </td>
              </tr>
            ) : holdings.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">
                  No investments yet
                </td>
              </tr>
            ) : (
              holdings.map((h, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {h.asset_name?.toUpperCase()}
                  </td>

                  {/* ✅ FIXED: Quantity now shows correctly */}
                  <td className="p-3 text-center">
                    {Number(h.units)}
                  </td>

                  {/* ✅ FIXED: Avg Price safe render */}
                  <td className="p-3 text-center">
                    ₹{Number(h.price_per_unit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* BUY / SELL MODAL */}
      {showModal && (
        <BuySellModal
          type={modalType}
          close={() => setShowModal(false)}
          refresh={fetchPortfolio}
        />
      )}
    </div>
  );
}
