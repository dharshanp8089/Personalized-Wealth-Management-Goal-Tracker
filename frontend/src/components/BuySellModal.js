import { useState } from "react";
import api from "../services/api";

export default function BuySellModal({ type, close, refresh }) {
  const [assetName, setAssetName] = useState("");
  const [units, setUnits] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setError("");

      const endpoint =
        type === "buy" ? "/portfolio/buy" : "/portfolio/sell";

      await api.post(
        endpoint,
        null,
        {
          params: {
            asset_name: assetName.trim(), // 🔥 important
            units: Number(units),
            price_per_unit: Number(pricePerUnit),
          },
        }
      );

      close();
      refresh();
    } catch (err) {
      console.error(err);
      setError("Transaction failed. Buy first or check quantity.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-4 capitalize">
          {type} Investment
        </h2>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <input
          className="input"
          placeholder="Asset Name (e.g. TCS)"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Units"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Price per unit"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          <button className="btn bg-blue-600 text-white w-full" onClick={submit}>
            Confirm
          </button>
          <button className="btn w-full" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
