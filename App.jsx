import React, { useState, useEffect } from "react";

const mondayDates2026 = [
  "2026-04-20","2026-04-27","2026-05-04","2026-05-11",
  "2026-05-18","2026-05-25","2026-06-01","2026-06-08",
  "2026-06-15","2026-06-22","2026-06-29"
];

export default function App() {

  const [members, setMembers] = useState([
    { name: "Alan Kuhlwilm", section: "Gents" },
    { name: "William McIntyre", section: "Gents" },
    { name: "Willie Brown", section: "Gents" },
    { name: "Alan Gill", section: "Gents" },
    { name: "Frank Devlin", section: "Gents" }
  ]);

  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("points");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState(mondayDates2026[0]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("points", JSON.stringify(points));
  }, [points]);

  // ✅ AUTO CREATE NEW WEEK (ALL PLAYERS ZERO)
  useEffect(() => {
    const prevIndex = mondayDates2026.indexOf(selectedDate) - 1;
    const prevDate = mondayDates2026[prevIndex];

    let updated = { ...points };

    Object.keys(points).forEach(player => {
      if (!updated[player]) updated[player] = {};

      // if not exists → set ZERO (NOT previous score)
      if (updated[player][selectedDate] === undefined) {
        updated[player][selectedDate] = 0;
      }
    });

    setPoints(updated);

  }, [selectedDate]);

  // ➕ ADD PLAYER
  const addPlayer = (name) => {
    if (!points[name]) {
      setPoints({
        ...points,
        [name]: { [selectedDate]: 0 }
      });
    } else {
      setPoints({
        ...points,
        [name]: {
          ...points[name],
          [selectedDate]: 0
        }
      });
    }
  };

  // ✏ UPDATE SCORE
  const updateScore = (name, value) => {
    setPoints({
      ...points,
      [name]: {
        ...points[name],
        [selectedDate]: Number(value)
      }
    });
  };

  // 📊 TOTAL = SUM OF ALL WEEKS
  const getTotal = (name) => {
    return Object.values(points[name] || {}).reduce(
      (a, b) => a + Number(b || 0), 0
    );
  };

  // 🎯 PLAYERS ONLY (NO ASSOCIATES)
  const players = Object.keys(points);

  // 🏆 LEADERBOARD
  const leaderboard = players
    .map(p => ({ name: p, total: getTotal(p) }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>

      <h2>Monday Night Points – 2026</h2>

      <select
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      >
        {mondayDates2026.map(d => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <h3>Add Player</h3>

      <input
        placeholder="Search member..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {members
        .filter(m =>
          m.section === "Gents" &&
          m.name.toLowerCase().includes(search.toLowerCase())
        )
        .map(m => (
          <div key={m.name}>
            {m.name}
            <button onClick={() => addPlayer(m.name)}>Add</button>
          </div>
        ))}

      <h3>This Week</h3>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Player</th>
            <th>Points</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {players.map(p => (
            <tr key={p}>
              <td>{p}</td>

              <td>
                <input
                  type="number"
                  value={points[p]?.[selectedDate] ?? 0}
                  onChange={(e) => updateScore(p, e.target.value)}
                />
              </td>

              <td>{getTotal(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Monday Points Leaderboard</h2>

      <table border="1" cellPadding="6">
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
