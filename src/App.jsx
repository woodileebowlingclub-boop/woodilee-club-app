import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("diary");

  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [points, setPoints] = useState([]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSection, setNewMemberSection] = useState("Gents");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const [pointsName, setPointsName] = useState("");
  const [pointsDate, setPointsDate] = useState("");
  const [pointsValue, setPointsValue] = useState("");

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
      setMessage("");
    } else {
      alert("Wrong PIN");
    }
  };

  const handleAdminLogin = () => {
    if (adminPin === ADMIN_PIN) {
      setAdminUnlocked(true);
      setMessage("");
    } else {
      alert("Wrong admin PIN");
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadEntries();
    loadMembers();
    loadPoints();
  }, [loggedIn]);

  const loadEntries = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setMessage("Could not load diary entries.");
    } else {
      setEntries(data || []);
    }

    setLoading(false);
  };

  const loadMembers = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setMessage("Could not load members.");
    } else {
      setMembers(data || []);
    }
  };

  const loadPoints = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    const { data, error } = await supabase
      .from("monday_points")
      .select("*")
      .order("week_date", { ascending: true });

    if (error) {
      setMessage("Could not load Monday Points.");
    } else {
      setPoints(data || []);
    }
  };

  const addEntry = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    if (!title || !date) {
      setMessage("Enter event title and date.");
      return;
    }

    const { error } = await supabase.from("events").insert([
      {
        title: title,
        date_text: date,
        note: ""
      }
    ]);

    if (error) {
      setMessage(`Could not save diary entry: ${error.message}`);
      return;
    }

    setTitle("");
    setDate("");
    setMessage("Diary entry added.");
    loadEntries();
  };

  const addMember = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    if (!newMemberName) {
      setMessage("Enter member name.");
      return;
    }

    const { error } = await supabase.from("members").insert([
      {
        name: newMemberName,
        section: newMemberSection,
        phone: newMemberPhone,
        email: newMemberEmail
      }
    ]);

    if (error) {
      setMessage(`Could not save member: ${error.message}`);
      return;
    }

    setNewMemberName("");
    setNewMemberSection("Gents");
    setNewMemberPhone("");
    setNewMemberEmail("");
    setMessage("Member added.");
    loadMembers();
  };

  const addPoints = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    if (!pointsName || !pointsDate || pointsValue === "") {
      setMessage("Enter member name, date and points.");
      return;
    }

    const { error } = await supabase.from("monday_points").insert([
      {
        member_name: pointsName,
        week_date: pointsDate,
        points: Number(pointsValue)
      }
    ]);

    if (error) {
      setMessage(`Could not save Monday Points: ${error.message}`);
      return;
    }

    setPointsName("");
    setPointsDate("");
    setPointsValue("");
    setMessage("Monday Points added.");
    loadPoints();
  };

  const deleteEntry = async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete diary entry: ${error.message}`);
      return;
    }

    setMessage("Diary entry deleted.");
    loadEntries();
  };

  const deleteMember = async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete member: ${error.message}`);
      return;
    }

    setMessage("Member deleted.");
    loadMembers();
  };

  const deletePoints = async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from("monday_points").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete Monday Points row: ${error.message}`);
      return;
    }

    setMessage("Monday Points row deleted.");
    loadPoints();
  };

  const mondayPoints = useMemo(() => {
    const totals = {};

    points.forEach((row) => {
      const name = String(row.member_name || "").trim();
      if (!name) return;
      totals[name] = (totals[name] || 0) + Number(row.points || 0);
    });

    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      .map((row, index) => ({
        position: index + 1,
        name: row.name,
        total: row.total
      }));
  }, [points]);

  if (!loggedIn) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h1>Woodilee Bowling Club</h1>
        <h2>Members Diary</h2>

        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{ padding: 10, marginRight: 10 }}
        />

        <button onClick={handleLogin} style={{ padding: 10 }}>
          Enter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Woodilee Bowling Club</h1>
      <h2>Members Diary</h2>

      {message && (
        <div style={{ marginBottom: 15, padding: 10, background: "#fff3cd", border: "1px solid #e0c36c" }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("diary")}
          style={{
            padding: 10,
            marginRight: 10,
            background: activeTab === "diary" ? "#d97706" : "#eee",
            color: activeTab === "diary" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          Diary
        </button>

        <button
          onClick={() => setActiveTab("members")}
          style={{
            padding: 10,
            marginRight: 10,
            background: activeTab === "members" ? "#d97706" : "#eee",
            color: activeTab === "members" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          Members
        </button>

        <button
          onClick={() => setActiveTab("monday-points")}
          style={{
            padding: 10,
            marginRight: 10,
            background: activeTab === "monday-points" ? "#d97706" : "#eee",
            color: activeTab === "monday-points" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          Monday Points
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          style={{
            padding: 10,
            background: activeTab === "admin" ? "#d97706" : "#eee",
            color: activeTab === "admin" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          Admin
        </button>
      </div>

      {activeTab === "diary" && (
        <div>
          <h3>Diary Entries</h3>

          {loading && <p>Loading...</p>}

          <ul>
            {entries.map((item) => (
              <li key={item.id} style={{ marginBottom: 8 }}>
                <strong>{item.date_text}</strong> — {item.title}
                <button
                  onClick={() => deleteEntry(item.id)}
                  style={{ marginLeft: 10, padding: "4px 8px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "members" && (
        <div>
          <h3>Members List</h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 20
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Name</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Section</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Phone</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Email</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.section}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.phone}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.email}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>
                    <button onClick={() => deleteMember(member.id)} style={{ padding: "4px 8px" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "monday-points" && (
        <div>
          <h3>Monday Points</h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 20,
              marginBottom: 30
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Position</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Name</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {mondayPoints.map((row) => (
                <tr key={row.name}>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.position}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Raw Monday Points Rows</h4>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 20
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Name</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Date</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Points</th>
                <th style={{ border: "1px solid #ccc", padding: 10, textAlign: "left" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {points.map((row) => (
                <tr key={row.id}>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.member_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.week_date}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{row.points}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>
                    <button onClick={() => deletePoints(row.id)} style={{ padding: "4px 8px" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "admin" && (
        <div>
          {!adminUnlocked ? (
            <div>
              <h3>Admin Login</h3>

              <input
                type="password"
                placeholder="Enter Admin PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                style={{ padding: 10, marginRight: 10 }}
              />

              <button onClick={handleAdminLogin} style={{ padding: 10 }}>
                Enter
              </button>
            </div>
          ) : (
            <div>
              <h3>Admin Panel</h3>

              <div style={{ marginBottom: 30 }}>
                <h4>Add Member</h4>

                <input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <select
                  value={newMemberSection}
                  onChange={(e) => setNewMemberSection(e.target.value)}
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                >
                  <option>Gents</option>
                  <option>Ladies</option>
                  <option>Associate</option>
                </select>

                <input
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="Phone"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <input
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <br />

                <button onClick={addMember} style={{ padding: 10 }}>
                  Save Member
                </button>
              </div>

              <div style={{ marginBottom: 30 }}>
                <h4>Add Diary Entry</h4>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <br />

                <button onClick={addEntry} style={{ padding: 10 }}>
                  Save Diary Entry
                </button>
              </div>

              <div>
                <h4>Add Monday Points</h4>

                <input
                  value={pointsName}
                  onChange={(e) => setPointsName(e.target.value)}
                  placeholder="Member name"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <input
                  type="date"
                  value={pointsDate}
                  onChange={(e) => setPointsDate(e.target.value)}
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <input
                  type="number"
                  value={pointsValue}
                  onChange={(e) => setPointsValue(e.target.value)}
                  placeholder="Points"
                  style={{ padding: 10, marginRight: 10, marginBottom: 10 }}
                />

                <br />

                <button onClick={addPoints} style={{ padding: 10 }}>
                  Save Monday Points
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}