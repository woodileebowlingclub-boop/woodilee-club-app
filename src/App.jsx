import { useState } from "react";

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const CLUB_PIN = "1911";

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
    } else {
      alert("Wrong PIN");
    }
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
        <br /><br />
        <button onClick={handleLogin}>Enter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Woodilee Bowling Club</h1>
      <h2>Members Diary</h2>
      <p>✅ Logged in</p>
    </div>
  );
}