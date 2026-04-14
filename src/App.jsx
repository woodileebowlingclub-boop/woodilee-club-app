import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
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
      alert("Could not load entries");
    } else {
      setEntries(data || []);
    }

    setLoading(false);
  };

  const addEntry = async () => {
    if (text === "") return;

    if (!supabase) {
      alert("Supabase not connected");
      return;
    }

    const { error } = await supabase.from("events").insert([
      {
        title: text,
        date_text: new Date().toLocaleDateString("en-GB"),
        note: ""
      }
    ]);

    if (error) {
      alert("Could not save entry");
      return;
    }

    setText("");
    loadEntries();
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Woodilee Bowling Club</h1>
        <h2>Members Diary</h2>

        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <button onClick={handleLogin}>Enter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Woodilee Bowling Club</h1>
      <h2>Members Diary</h2>

      <h3>Add Entry</h3>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
      />

      <button onClick={addEntry}>Add</button>

      <h3>Entries</h3>

      {loading && <p>Loading...</p>}

      <ul>
        {entries.map((item) => (
          <li key={item.id}>
            <strong>{item.date_text}</strong> — {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}