import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

export default function App() {
  const [pin, setPin] = useState("");
  const [view, setView] = useState("home");
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // EVENTS
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("id", { ascending: true });

    // POSTS (FIXED TABLE NAME)
    const { data: postsData } = await supabase
      .from("information_posts")
      .select("*")
      .order("id", { ascending: true });

    setEvents(eventsData || []);
    setPosts(postsData || []);
  }

  function formatDate(dateText) {
    if (!dateText) return "";

    // If already correct format, return as is
    if (dateText.includes(" ") && isNaN(dateText)) return dateText;

    const d = new Date(dateText);
    if (isNaN(d)) return dateText;

    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function login(type) {
    if (type === "member" && pin === CLUB_PIN) setView("diary");
    if (type === "admin" && pin === ADMIN_PIN) setView("admin");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Woodilee Bowling Club</h1>
        <p>Members diary, notices and club information</p>

        <input
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={styles.input}
        />

        <div>
          <button onClick={() => login("member")} style={styles.btnPrimary}>
            Member Login
          </button>
          <button onClick={() => login("admin")} style={styles.btnSecondary}>
            Admin Login
          </button>
        </div>
      </div>

      {view === "diary" && (
        <div style={styles.section}>
          <h2>Diary</h2>

          {events.map((e) => (
            <div key={e.id} style={styles.item}>
              <strong>{e.title}</strong>
              <div>{formatDate(e.date_text)}</div>
              <div>{e.content}</div>
            </div>
          ))}
        </div>
      )}

      {view === "admin" && (
        <div style={styles.section}>
          <h2>Admin</h2>

          {posts.map((p) => (
            <div key={p.id} style={styles.item}>
              <strong>{p.title}</strong>
              <div>{p.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: "#7a2638",
    minHeight: "100vh",
    padding: 20,
    color: "#222",
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  btnPrimary: {
    background: "#7a2638",
    color: "#fff",
    padding: 10,
    marginRight: 10,
    border: "none",
  },
  btnSecondary: {
    background: "#666",
    color: "#fff",
    padding: 10,
    border: "none",
  },
  section: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  item: {
    padding: 10,
    borderBottom: "1px solid #ddd",
  },
};
