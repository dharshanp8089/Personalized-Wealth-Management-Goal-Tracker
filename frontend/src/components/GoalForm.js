import { useState } from "react";
import api from "../services/api";

export default function GoalForm({ refresh }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState("");

  const submit = async () => {
    await api.post("/goals", {
      title,
      target_amount: amount,
      target_year: year,
    });
    setTitle(""); setAmount(""); setYear("");
    refresh();
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <input className="input" placeholder="Goal name"
        value={title} onChange={e=>setTitle(e.target.value)} />
      <input className="input" placeholder="Amount"
        value={amount} onChange={e=>setAmount(e.target.value)} />
      <input className="input" placeholder="Target year"
        value={year} onChange={e=>setYear(e.target.value)} />
      <button className="btn mt-2" onClick={submit}>Add Goal</button>
    </div>
  );
}
