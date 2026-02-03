import api from "../services/api";

export default function GoalsList({ goals, refresh }) {
  const remove = async (id) => {
    await api.delete(`/goals/${id}`);
    refresh();
  };

  return (
    <div className="space-y-3">
      {goals.map(g => (
        <div key={g.id} className="bg-white p-4 rounded shadow flex justify-between">
          <div>
            <p className="font-semibold">{g.title}</p>
            <p>₹{g.target_amount} by {g.target_year}</p>
          </div>
          <button className="text-red-600" onClick={()=>remove(g.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
