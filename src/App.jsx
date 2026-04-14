import React, { useState } from "react";

const CLUB_PIN = "1911";

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
    } else {
      alert("Wrong PIN");
    }
  };

  const addEntry = () => {
    if (text === "") return;
    setEntries([...entries, text]);
    setText("");
  };

  // 🔐 LOGIN SCREEN
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

  // ✅ MAIN APP
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

      <ul>
        {entries.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}