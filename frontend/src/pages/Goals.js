import { useEffect, useState } from "react";
import api from "../services/api";

export default function Goals() {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");

  // Fetch goals
  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Create goal (IMPORTANT FIX)
  const addGoal = async () => {
    setError("");

    if (!title || !targetAmount || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    try {
      await api.post("/goals", null, {
        params: {
          title: title,
          target_amount: Number(targetAmount),
          start_date: startDate,
          end_date: endDate,
        },
      });

      setTitle("");
      setTargetAmount("");
      setStartDate("");
      setEndDate("");
      fetchGoals();
    } catch (err) {
      console.error(err.response?.data);
      setError("Failed to add goal (422 from backend)");
    }
  };

  // Delete goal
  const deleteGoal = async (id) => {
    await api.delete(`/goals/${id}`);
    fetchGoals();
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Financial Goals</h1>

      {/* Add Goal */}
      <div className="bg-white p-6 shadow rounded mb-8">
        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          className="input"
          placeholder="Goal title (eg: Buy Car)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="input mt-3"
          type="number"
          placeholder="Target amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />

        <input
          className="input mt-3"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          className="input mt-3"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className="btn mt-4 w-full" onClick={addGoal}>
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <p className="text-gray-500">No goals added yet.</p>
      ) : (
        goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-white p-4 shadow rounded mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{goal.title}</p>
              <p className="text-sm text-gray-600">
                ₹{goal.target_amount} • {goal.start_date} → {goal.end_date}
              </p>
            </div>

            <button
              className="text-red-600 hover:underline"
              onClick={() => deleteGoal(goal.id)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
