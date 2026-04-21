import React, { useState } from "react";

const ADMIN_PIN = "1954";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminBox, setShowAdminBox] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [tapCount, setTapCount] = useState(0);
  const [tab, setTab] = useState("home");

  const [members] = useState([
    { name: "John Smith", phone: "447700900001" },
    { name: "David Brown", phone: "447700900002" },
    { name: "Alan McKay", phone: "447700900003" },
  ]);

  const [events] = useState([
    { title: "Opening Day", date: "11 April", time: "2:00pm" },
  ]);

  const [officeBearers] = useState([
    { role: "President", name: "J Smith", phone: "447700900001" },
    { role: "Secretary", name: "D Brown", phone: "447700900002" },
  ]);

  const [coaches] = useState([
    { name: "Club Coach", phone: "447700900003" },
  ]);

  // Hidden admin trigger (tap top right 5 times)
  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setShowAdminBox(true);
      setTapCount(0);
    }
  };

  const loginAdmin = () => {
    if (adminPin === ADMIN_PIN) {
      setIsAdmin(true);
      setShowAdminBox(false);
      setAdminPin("");
    } else {
      alert("Wrong PIN");
    }
  };

  const styles = {
    page: {
      fontFamily: "Arial",
      background: "#1e3a8a",
      minHeight: "100vh",
      padding: 10,
      color: "#fff",
    },
    header: {
      background: "#0f172a",
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      textAlign: "center",
      position: "relative",
    },
    secret: {
      position: "absolute",
      top: 5,
      right: 10,
      width: 30,
      height: 30,
    },
    tabs: {
      display: "flex",
      gap: 5,
      flexWrap: "wrap",
      marginBottom: 10,
    },
    tabBtn: {
      flex: 1,
      padding: 10,
      background: "#2563eb",
      border: "none",
      borderRadius: 8,
      color: "#fff",
    },
    card: {
      background: "#f8fafc",
      color: "#000",
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
    },
    btn: {
      padding: 6,
      background: "green",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      marginTop: 5,
    },
    adminBox: {
      background: "#000",
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    input: {
      padding: 8,
      width: "100%",
      marginBottom: 10,
    },
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div onClick={handleSecretTap} style={styles.secret}></div>
        <h2>Woodilee Bowling Club</h2>
        <p>Club App</p>
      </div>

      {/* ADMIN LOGIN BOX */}
      {showAdminBox && (
        <div style={styles.adminBox}>
          <h3>Admin Login</h3>
          <input
            type="password"
            placeholder="Enter PIN"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            style={styles.input}
          />
          <button onClick={loginAdmin} style={styles.btn}>
            Login
          </button>
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        <button style={styles.tabBtn} onClick={() => setTab("home")}>
          Home
        </button>
        <button style={styles.tabBtn} onClick={() => setTab("diary")}>
          Diary
        </button>
        <button style={styles.tabBtn} onClick={() => setTab("members")}>
          Members
        </button>
        <button style={styles.tabBtn} onClick={() => setTab("office")}>
          Office
        </button>
        <button style={styles.tabBtn} onClick={() => setTab("coaches")}>
          Coaches
        </button>
      </div>

      {/* CONTENT */}
      {tab === "home" && <div>Welcome to the club app</div>}

      {tab === "diary" &&
        events.map((e, i) => (
          <div key={i} style={styles.card}>
            <b>{e.title}</b>
            <div>{e.date}</div>
            <div>{e.time}</div>
          </div>
        ))}

      {tab === "members" &&
        members.map((m, i) => (
          <div key={i} style={styles.card}>
            {m.name}
            <br />
            <button
              style={styles.btn}
              onClick={() =>
                window.open(`https://wa.me/${m.phone}`, "_blank")
              }
            >
              WhatsApp
            </button>
          </div>
        ))}

      {tab === "office" &&
        officeBearers.map((o, i) => (
          <div key={i} style={styles.card}>
            <b>{o.role}</b>
            <br />
            {o.name}
            <br />
            <button
              style={styles.btn}
              onClick={() =>
                window.open(`https://wa.me/${o.phone}`, "_blank")
              }
            >
              WhatsApp
            </button>
          </div>
        ))}

      {tab === "coaches" &&
        coaches.map((c, i) => (
          <div key={i} style={styles.card}>
            {c.name}
            <br />
            <button
              style={styles.btn}
              onClick={() =>
                window.open(`https://wa.me/${c.phone}`, "_blank")
              }
            >
              WhatsApp
            </button>
          </div>
        ))}
    </div>
  );
}
