import React, { useEffect, useState } from "react";

const mondayDates2026 = [
  "2026-04-20","2026-04-27","2026-05-04","2026-05-11",
  "2026-05-18","2026-05-25","2026-06-01","2026-06-08",
];

export default function App() {

  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("points2026");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState(mondayDates2026[0]);
  const [newPlayer, setNewPlayer] = useState("");

  useEffect(() => {
    localStorage.setItem("points2026", JSON.stringify(points));
  }, [points]);

  // ✅ THIS IS THE FIX (ZERO EACH NEW WEEK)
  useEffect(() => {
    const updated = { ...points };

    Object.keys(updated).forEach((player) => {
      if (updated[player][selectedDate] === undefined) {
        updated[player][selectedDate] = 0; // ALWAYS ZERO
      }
    });

    setPoints(updated);
  }, [selectedDate]);

  const addPlayer = () => {
    if (!newPlayer) return;

    setPoints({
      ...points,
      [newPlayer]: {
        ...(points[newPlayer] || {}),
        [selectedDate]: 0,
      },
    });

    setNewPlayer("");
  };

  const updateScore = (player, value) => {
    setPoints({
      ...points,
      [player]: {
        ...points[player],
        [selectedDate]: Number(value),
      },
    });
  };

  const getTotal = (player) => {
    return Object.values(points[player] || {}).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
  };

  const leaderboard = Object.keys(points)
    .map((p) => ({
      name: p,
      total: getTotal(p),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>

      <h2>Monday Night Points – 2026</h2>

      <select
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      >
        {mondayDates2026.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <h3>Add Player</h3>

      <input
        value={newPlayer}
        onChange={(e) => setNewPlayer(e.target.value)}
        placeholder="Enter player name"
      />

      <button onClick={addPlayer}>Add</button>

      <h3>This Week</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Player</th>
            <th>Points</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {Object.keys(points).map((player) => (
            <tr key={player}>
              <td>{player}</td>

              <td>
                <input
                  type="number"
                  value={points[player]?.[selectedDate] ?? 0}
                  onChange={(e) =>
                    updateScore(player, e.target.value)
                  }
                />
              </td>

              <td>{getTotal(player)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Monday Points Leaderboard</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {leaderboard.map((p, i) => (
            <tr key={p.name}>
              <td>{i + 1}</td>
              <td>{p.name}</td>
              <td>{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
