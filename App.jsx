import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const ADMIN_PIN = "1954";

export default function App() {
  const [adminMode, setAdminMode] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weekInput, setWeekInput] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

  const [rows, setRows] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPoints();
  }, []);

  async function loadPoints() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("monday_night_points")
      .select("*")
      .order("week_date", { ascending: true })
      .order("player_name", { ascending: true });

    if (error) {
      setErrorMessage(error.message || "Failed to load data");
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  }

  const weeks = useMemo(() => {
    const uniqueWeeks = [...new Set(rows.map((r) => r.week_date))];
    return uniqueWeeks.sort((a, b) => new Date(a) - new Date(b));
  }, [rows]);

  const players = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (!map.has(row.player_name)) {
        map.set(row.player_name, {
          name: row.player_name,
          scores: {},
        });
      }

      map.get(row.player_name).scores[row.week_date] = {
        id: row.id,
        points: row.points,
      };
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const playersWithTotals = useMemo(() => {
    return players.map((player) => {
      const total = weeks.reduce((sum, week) => {
        return sum + Number(player.scores?.[week]?.points || 0);
      }, 0);

      return {
        ...player,
        total,
      };
    });
  }, [players, weeks]);

  function handleAdminLogin() {
    if (pinInput === ADMIN_PIN) {
      setAdminMode(true);
      setPinInput("");
    } else {
      alert("Incorrect admin PIN");
    }
  }

  function handleAdminLogout() {
    setAdminMode(false);
  }

  async function addNewWeek() {
    const newWeek = weekInput.trim();

    if (!newWeek) {
      alert("Enter a date first");
      return;
    }

    if (weeks.includes(newWeek)) {
      alert("That week already exists");
      return;
    }

    if (players.length === 0) {
      alert("Add at least one player first");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const payload = players.map((player) => ({
      player_name: player.name,
      week_date: newWeek,
      points: 0,
    }));

    const { error } = await supabase
      .from("monday_night_points")
      .upsert(payload, { onConflict: "player_name,week_date" });

    if (error) {
      setErrorMessage(error.message || "Failed to add week");
      setSaving(false);
      return;
    }

    setWeekInput("");
    await loadPoints();
    setSaving(false);
  }

  async function addPlayer() {
    const name = newPlayerName.trim();

    if (!name) {
      alert("Enter player name");
      return;
    }

    const exists = players.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Player already exists");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const targetWeeks = weeks.length > 0 ? weeks : [new Date().toISOString().slice(0, 10)];

    const payload = targetWeeks.map((week) => ({
      player_name: name,
      week_date: week,
      points: 0,
    }));

    const { error } = await supabase
      .from("monday_night_points")
      .insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add player");
      setSaving(false);
      return;
    }

    setNewPlayerName("");
    await loadPoints();
    setSaving(false);
  }

  async function updateScore(cellId, value) {
    let clean = String(value).replace(/[^0-9]/g, "");
    if (clean === "") clean = "0";

    const numericValue = Number(clean);

    setRows((prev) =>
      prev.map((row) =>
        row.id === cellId ? { ...row, points: numericValue } : row
      )
    );

    const { error } = await supabase
      .from("monday_night_points")
      .update({ points: numericValue })
      .eq("id", cellId);

    if (error) {
      setErrorMessage(error.message || "Failed to update score");
      await loadPoints();
    }
  }

  async function removePlayer(playerName) {
    const ok = window.confirm(`Remove ${playerName} from all weeks?`);
    if (!ok) return;

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("monday_night_points")
      .delete()
      .eq("player_name", playerName);

    if (error) {
      setErrorMessage(error.message || "Failed to remove player");
      setSaving(false);
      return;
    }

    await loadPoints();
    setSaving(false);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <h2 style={styles.subtitle}>Monday Night Points Table</h2>

          {!adminMode ? (
            <div style={styles.loginRow}>
              <input
                type="password"
                placeholder="Admin PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleAdminLogin} style={styles.button}>
                Admin Login
              </button>
            </div>
          ) : (
            <div style={styles.adminPanel}>
              <input
                type="date"
                value={weekInput}
                onChange={(e) => setWeekInput(e.target.value)}
                style={styles.input}
              />
              <button onClick={addNewWeek} style={styles.button} disabled={saving}>
                Add New Week
              </button>

              <input
                type="text"
                placeholder="Add player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                style={styles.input}
              />
              <button onClick={addPlayer} style={styles.button} disabled={saving}>
                Add Player
              </button>

              <button
                onClick={handleAdminLogout}
                style={{ ...styles.button, background: "#555" }}
              >
                Logout
              </button>
            </div>
          )}

          <div style={styles.note}>
            New week columns start at <strong>0</strong> for everybody, but the{" "}
            <strong>Total</strong> still includes all previous weeks.
          </div>

          {loading && <div style={styles.info}>Loading table…</div>}
          {saving && <div style={styles.info}>Saving…</div>}
          {errorMessage && <div style={styles.error}>{errorMessage}</div>}

          {!loading && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thLeft}>Player</th>
                    {weeks.map((week) => (
                      <th key={week} style={styles.th}>
                        {formatDate(week)}
                      </th>
                    ))}
                    <th style={styles.th}>Total</th>
                    {adminMode && <th style={styles.th}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {playersWithTotals.length === 0 ? (
                    <tr>
                      <td colSpan={weeks.length + (adminMode ? 3 : 2)} style={styles.empty}>
                        No Monday night players yet
                      </td>
                    </tr>
                  ) : (
                    playersWithTotals.map((player) => (
                      <tr key={player.name}>
                        <td style={styles.tdLeft}>{player.name}</td>

                        {weeks.map((week) => {
                          const cell = player.scores?.[week];

                          return (
                            <td key={week} style={styles.td}>
                              {adminMode && cell ? (
                                <input
                                  type="text"
                                  value={cell.points ?? 0}
                                  onChange={(e) => updateScore(cell.id, e.target.value)}
                                  style={styles.scoreInput}
                                />
                              ) : (
                                cell?.points ?? 0
                              )}
                            </td>
                          );
                        })}

                        <td style={styles.totalTd}>{player.total}</td>

                        {adminMode && (
                          <td style={styles.td}>
                            <button
                              onClick={() => removePlayer(player.name)}
                              style={styles.removeButton}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #5b1d2a 0%, #7a2638 55%, #a33a4d 100%)",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  card: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  title: {
    margin: 0,
    color: "#7a2638",
    fontSize: 30,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: "#333",
    fontSize: 22,
  },
  loginRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  adminPanel: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  button: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  note: {
    marginBottom: 14,
    color: "#555",
    fontSize: 14,
  },
  info: {
    marginBottom: 10,
    color: "#333",
    fontWeight: 600,
  },
  error: {
    marginBottom: 10,
    color: "#b00020",
    fontWeight: 700,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700,
  },
  th: {
    background: "#7a2638",
    color: "#fff",
    border: "1px solid #d7d7d7",
    padding: 12,
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  thLeft: {
    background: "#7a2638",
    color: "#fff",
    border: "1px solid #d7d7d7",
    padding: 12,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    border: "1px solid #ddd",
    padding: 10,
    textAlign: "center",
  },
  tdLeft: {
    border: "1px solid #ddd",
    padding: 10,
    textAlign: "left",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  totalTd: {
    border: "1px solid #ddd",
    padding: 10,
    textAlign: "center",
    fontWeight: 700,
    background: "#faf3f5",
  },
  scoreInput: {
    width: 60,
    padding: 6,
    borderRadius: 6,
    border: "1px solid #ccc",
    textAlign: "center",
    fontSize: 14,
  },
  removeButton: {
    background: "#b00020",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
  },
  empty: {
    border: "1px solid #ddd",
    padding: 18,
    textAlign: "center",
  },
};
