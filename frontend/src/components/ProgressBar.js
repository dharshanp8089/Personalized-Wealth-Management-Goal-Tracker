function ProgressBar({ current, total }) {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="w-full bg-gray-200 h-2 rounded">
      <div
        className="bg-blue-600 h-2 rounded"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default ProgressBar;
