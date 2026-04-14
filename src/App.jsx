import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("diary");

  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
    } else {
      alert("Wrong PIN");
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadEntries();
    loadMembers();
  }, [loggedIn]);

  const loadEntries = async () => {
    if (!supabase) {
      alert("Supabase not connected");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Could not load diary entries");
    } else {
      setEntries(data || []);
    }

    setLoading(false);
  };

  const loadMembers = async () => {
    if (!supabase) {
      alert("Supabase not connected");
      return;
    }

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      alert("Could not load members");
    } else {
      setMembers(data || []);
    }
  };

  const addEntry = async () => {
    if (!title || !date) return;

    const { error } = await supabase.from("events").insert([
      {
        title: title,
        date_text: date,
        note: ""
      }
    ]);

    if (error) {
      alert("Could not save entry");
      return;
    }

    setTitle("");
    setDate("");
    loadEntries();
  };

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
            background: activeTab === "members" ? "#d97706" : "#eee",
            color: activeTab === "members" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          Members
        </button>
      </div>

      {activeTab === "diary" && (
        <div>
          <h3>Add Diary Entry</h3>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            style={{ padding: 10, marginRight: 10 }}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 10, marginRight: 10 }}
          />

          <button onClick={addEntry} style={{ padding: 10 }}>
            Add
          </button>

          <h3 style={{ marginTop: 30 }}>Diary Entries</h3>

          {loading && <p>Loading...</p>}

          <ul>
            {entries.map((item) => (
              <li key={item.id}>
                <strong>{item.date_text}</strong> — {item.title}
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
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.name}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.section}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.phone}</td>
                  <td style={{ border: "1px solid #ccc", padding: 10 }}>{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}