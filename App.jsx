import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/WBC Logo.png";

/* ---------------- CONFIG ---------------- */

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

const mondayDates2026 = [
  "2026-04-20","2026-04-27","2026-05-04","2026-05-11","2026-05-18",
  "2026-05-25","2026-06-01","2026-06-08","2026-06-15","2026-06-22",
  "2026-06-29","2026-07-06","2026-07-13","2026-07-20","2026-07-27",
  "2026-08-03","2026-08-10","2026-08-17","2026-08-24","2026-08-31",
  "2026-09-07","2026-09-14","2026-09-21"
];

/* ---------------- STYLES ---------------- */

const styles = {
  page: { padding: 16, fontFamily: "Arial", background: "#7a2638", minHeight: "100vh" },
  panel: { background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  button: { padding: 10, background: "#8b1e3f", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  input: { padding: 10, width: "100%", marginBottom: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#8b1e3f", color: "#fff", padding: 8 },
  td: { padding: 8, borderBottom: "1px solid #ddd", textAlign: "center" }
};

/* ---------------- MONDAY POINTS ADMIN ---------------- */

function MondayPointsAdmin({ members }) {
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("points");
    return saved ? JSON.parse(saved) : {};
  });

  const [date, setDate] = useState(mondayDates2026[0]);
  const [search, setSearch] = useState("");

  const save = (data) => {
    setPoints(data);
    localStorage.setItem("points", JSON.stringify(data));
  };

  const index = mondayDates2026.indexOf(date);

  /* players who played BEFORE */
  const players = useMemo(() => {
    const set = new Set();
    Object.keys(points).forEach(name => {
      for (let i = 0; i < index; i++) {
        if (points[name]?.[mondayDates2026[i]] !== undefined) {
          set.add(name);
        }
      }
    });
    return Array.from(set);
  }, [points, index]);

  /* AUTO ADD ZERO FOR NEW WEEK */
  useEffect(() => {
    const updated = { ...points };

    players.forEach(name => {
      if (!updated[name]) updated[name] = {};
      if (updated[name][date] === undefined) {
        updated[name][date] = 0; // 🔴 ALWAYS ZERO
      }
    });

    save(updated);
  }, [date]); // eslint-disable-line

  const change = (name, value) => {
    const updated = {
      ...points,
      [name]: { ...(points[name] || {}), [date]: Number(value) }
    };
    save(updated);
  };

  const addPlayer = (name) => {
    const updated = {
      ...points,
      [name]: { ...(points[name] || {}), [date]: 0 }
    };
    save(updated);
  };

  const total = (name) => {
    return mondayDates2026.reduce(
      (sum, d) => sum + (Number(points[name]?.[d]) || 0),
      0
    );
  };

  const filteredMembers = members
    .filter(m => m.section !== "Associate")
    .map(m => m.name)
    .filter(name => name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={styles.panel}>
      <h2>Monday Night Points Edit</h2>

      <select value={date} onChange={e => setDate(e.target.value)}>
        {mondayDates2026.map(d => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <h3>Add Player</h3>
      <input
        placeholder="Search name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={styles.input}
      />

      {filteredMembers.map(name => (
        <div key={name}>
          {name}
          <button onClick={() => addPlayer(name)}>Add</button>
        </div>
      ))}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Points</th>
            <th style={styles.th}>Total</th>
          </tr>
        </thead>

        <tbody>
          {players.map(name => (
            <tr key={name}>
              <td style={styles.td}>{name}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={points[name]?.[date] || 0}
                  onChange={e => change(name, e.target.value)}
                />
              </td>
              <td style={styles.td}>{total(name)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- LEADERBOARD ---------------- */

function Leaderboard({ members }) {
  const [points, setPoints] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("points");
    setPoints(saved ? JSON.parse(saved) : {});
  }, []);

  const totals = members
    .filter(m => m.section !== "Associate")
    .map(m => ({
      name: m.name,
      total: Object.values(points[m.name] || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      )
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={styles.panel}>
      <h2>Monday Points Leaderboard</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Points</th>
          </tr>
        </thead>

        <tbody>
          {totals.map((p, i) => (
            <tr key={p.name}>
              <td style={styles.td}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </td>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- APP ---------------- */

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("points");

  useEffect(() => {
    if (loggedIn) loadMembers();
  }, [loggedIn]);

  const loadMembers = async () => {
    const { data } = await supabase.from("members").select("*");
    setMembers(data || []);
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button onClick={() => pin === CLUB_PIN && setLoggedIn(true)}>
          Enter
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <img src={logo} width="80" alt="" />

      <button onClick={() => setTab("points")}>Points</button>
      <button onClick={() => setTab("leaderboard")}>Leaderboard</button>

      {tab === "points" && <MondayPointsAdmin members={members} />}
      {tab === "leaderboard" && <Leaderboard members={members} />}
    </div>
  );
}
