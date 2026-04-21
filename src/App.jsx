import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/WBC Logo.png";

const ADMIN_PIN = "1954";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminMode, setAdminMode] = useState(false);
  const [pin, setPin] = useState("");

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [office, setOffice] = useState([]);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const e = await supabase.from("events").select("*").order("event_date");
    const n = await supabase.from("notices").select("*");
    const m = await supabase.from("members").select("*");
    const o = await supabase.from("office_bearers").select("*").order("display_order");
    const c = await supabase.from("coaches").select("*");

    setEvents(e.data || []);
    setNotices(n.data || []);
    setMembers(m.data || []);
    setOffice(o.data || []);
    setCoaches(c.data || []);
  }

  // ✅ NEXT EVENT ONLY
  const nextEvent = useMemo(() => {
    const today = new Date();

    return events
      .filter(e => new Date(e.event_date) >= today)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))[0];
  }, [events]);

  function login() {
    if (pin === ADMIN_PIN) setAdminMode(true);
    else alert("Wrong PIN");
  }

  // ================= UI =================

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <img src={logo} style={styles.logo} />
        <div>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <p style={styles.subtitle}>Members diary, notices and club information</p>
        </div>

        {!adminMode && (
          <div>
            <input
              placeholder="Admin PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={styles.input}
            />
            <button onClick={login}>Login</button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {["home","diary","notices","members","office","coaches"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {/* HOME */}
      {activeTab === "home" && (
        <div>
          <h2>Next Event</h2>

          {nextEvent ? (
            <div style={styles.card}>
              <b>{nextEvent.title}</b><br/>
              {nextEvent.event_date}<br/>
              {nextEvent.event_time}<br/>
              {nextEvent.details}
            </div>
          ) : "No upcoming events"}

          <h2>Latest Notices</h2>
          {notices.map(n => (
            <div key={n.id} style={styles.card}>
              <b>{n.title}</b><br/>
              {n.content}
            </div>
          ))}
        </div>
      )}

      {/* DIARY */}
      {activeTab === "diary" && events.map(e => (
        <div key={e.id} style={styles.card}>
          <b>{e.title}</b><br/>
          {e.event_date} {e.event_time}<br/>
          {e.details}
        </div>
      ))}

      {/* MEMBERS */}
      {activeTab === "members" && members.map(m => (
        <div key={m.id} style={styles.card}>
          <b>{m.full_name}</b><br/>

          {m.phone && (
            <>
              📞 {m.phone}  
              <a href={`https://wa.me/${m.phone.replace(/\D/g,"")}`}>
                WhatsApp
              </a>
            </>
          )}
        </div>
      ))}

      {/* OFFICE */}
      {activeTab === "office" && office.map(o => (
        <div key={o.id} style={styles.card}>
          <b>{o.role}</b><br/>
          {o.name}<br/>
          {o.phone}
        </div>
      ))}

      {/* COACHES */}
      {activeTab === "coaches" && coaches.map(c => (
        <div key={c.id} style={styles.card}>
          <b>{c.name}</b><br/>
          {c.phone}
        </div>
      ))}
    </div>
  );
}

// ================= STYLE =================

const styles = {
  page: {
    padding: 15,
    fontFamily: "Arial",
    background: "#7a1d32",
    color: "#222"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "#eee",
    padding: 20,
    borderRadius: 15
  },

  logo: {
    width: 80
  },

  title: {
    fontSize: 28
  },

  subtitle: {
    fontSize: 16
  },

  tabs: {
    marginTop: 10,
    display: "flex",
    gap: 10
  },

  card: {
    background: "#fff",
    padding: 10,
    margin: "10px 0",
    borderRadius: 10
  },

  input: {
    padding: 5
  }
};
