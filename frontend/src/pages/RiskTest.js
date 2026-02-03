import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuestionCard from "../components/QuestionCard";

const questions = [
  {
    q: "What is your investment time horizon?",
    options: [
      { text: "Less than 3 years", score: 1 },
      { text: "3 – 5 years", score: 2 },
      { text: "More than 5 years", score: 3 },
    ],
  },
  {
    q: "How would you react if your portfolio drops 20%?",
    options: [
      { text: "Withdraw immediately", score: 1 },
      { text: "Wait and watch", score: 2 },
      { text: "Invest more", score: 3 },
    ],
  },
  {
    q: "What is your primary investment goal?",
    options: [
      { text: "Capital protection", score: 1 },
      { text: "Balanced growth", score: 2 },
      { text: "Maximum returns", score: 3 },
    ],
  },
  {
    q: "What is your monthly income stability?",
    options: [
      { text: "Very unstable", score: 1 },
      { text: "Moderately stable", score: 2 },
      { text: "Highly stable", score: 3 },
    ],
  },
  {
    q: "How experienced are you with investments?",
    options: [
      { text: "Beginner", score: 1 },
      { text: "Intermediate", score: 2 },
      { text: "Experienced", score: 3 },
    ],
  },
];

export default function RiskTest() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  const handleAnswer = (value) => {
    const newScore = score + value;
    setScore(newScore);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      let risk = "Conservative";
      if (newScore >= 15) risk = "Aggressive";
      else if (newScore >= 9) risk = "Moderate";

      localStorage.setItem("risk_profile", risk);
      navigate("/risk-result");
    }
  };

  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Progress bar */}
      <div className="w-full max-w-xl mb-4">
        <div className="h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-blue-600 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Question {current + 1} of {questions.length}
        </p>
      </div>

      <QuestionCard
        question={questions[current].q}
        options={questions[current].options}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
