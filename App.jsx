function Leaderboard({ members = [] }) {
  const [points, setPoints] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("mondayPoints2026");
    setPoints(saved ? JSON.parse(saved) : {});
  }, []);

  const totals = Object.keys(points).map((name) => {
    const total = Object.values(points[name]).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    );
    return { name, total };
  });

  const sorted = totals.sort((a, b) => b.total - a.total);

  return (
    <div>
      <h3>Monday Points Leaderboard</h3>

      {sorted.map((p, i) => (
        <div
          key={p.name}
          style={{
            padding: 10,
            marginBottom: 6,
            background:
              i === 0
                ? "#ffd700"
                : i === 1
                ? "#c0c0c0"
                : i === 2
                ? "#cd7f32"
                : "#eee",
          }}
        >
          {i + 1}. {p.name} — {p.total}
        </div>
      ))}
    </div>
  );
}
