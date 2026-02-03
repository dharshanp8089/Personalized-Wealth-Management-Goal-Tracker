export default function QuestionCard({ question, options, onAnswer }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
      <h2 className="text-xl font-semibold mb-6">{question}</h2>

      <div className="space-y-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(opt.score)}
            className="w-full border rounded-lg p-3 text-left hover:bg-blue-50 transition"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
