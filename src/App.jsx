import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/WBC Logo.png";

const ADMIN_PIN = "1954";

const TABS = [
  { key: "home", label: "Home" },
  { key: "diary", label: "Diary" },
  { key: "notices", label: "Notices" },
  { key: "members", label: "Members" },
  { key: "office", label: "Office Bearers" },
  { key: "coaches", label: "Club Coaches" },
  { key: "documents", label: "Documents" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminMode, setAdminMode] = useState(false);
  const [pin, setPin] = useState("");

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: eventsData } = await supabase.from("events").select("*");
    const { data: noticesData } = await supabase.from("information_points").select("*");
    const { data: membersData } = await supabase.from("members").select("*");

    setEvents(eventsData || []);
    setNotices(noticesData || []);
    setMembers(membersData || []);
  }

  function loginAdmin() {
    if (pin === ADMIN_PIN) {
      setAdminMode(true);
      setPin("");
    } else {
      alert("Wrong PIN");
    }
  }

  const groupedMembers = useMemo(() => {
    return {
      Gents: members.filter(m => m.section === "Gents"),
      Ladies: members.filter(m => m.section === "Ladies"),
      Associate: members.filter(m => m.section === "Associate"),
    };
  }, [members]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        {/* HEADER */}
        <div style={styles.headerCard}>
          <div style={styles.headerRow}>
            <img src={logo} style={styles.logo} />
            <div>
              <h1 style={styles.title}>Woodilee Bowling Club</h1>
              <p style={styles.subtitle}>Members diary, notices and club information</p>
            </div>
          </div>

          {!adminMode && (
            <div style={{ marginTop: 15 }}>
              <input
                placeholder="Admin PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                style={styles.input}
              />
              <button style={styles.button} onClick={loginAdmin}>
                Admin Login
              </button>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={styles.tabBar}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={activeTab === t.key ? styles.activeTab : styles.tab}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* HOME */}
        {activeTab === "home" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Welcome</h2>
            <p style={styles.paragraph}>
              Welcome to the club app. Everything in one place.
            </p>
          </div>
        )}

        {/* DIARY */}
        {activeTab === "diary" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Diary</h2>
            {events.map(e => (
              <div key={e.id} style={styles.listItem}>
                <div style={styles.listTitle}>{e.title}</div>
                <div style={styles.listMeta}>{e.date_text}</div>
                {e.note && <div>{e.note}</div>}
              </div>
            ))}
          </div>
        )}

        {/* NOTICES */}
        {activeTab === "notices" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Notices</h2>
            {notices.map(n => (
              <div key={n.id} style={styles.listItem}>
                <div style={styles.listTitle}>{n.title}</div>
                <div>{n.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* MEMBERS */}
        {activeTab === "members" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Members</h2>

            {Object.entries(groupedMembers).map(([group, list]) => (
              <div key={group}>
                <h3>{group}</h3>
                {list.map(m => (
                  <div key={m.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{m.name}</div>
                    {m.phone && (
                      <a
                        href={`https://wa.me/${m.phone}`}
                        target="_blank"
                        style={styles.whatsApp}
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* STYLES */
const styles = {
  page: {
    background: "linear-gradient(#5b1d2a,#a33a4d)",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "Arial",
  },
  wrap: { maxWidth: 1000, margin: "auto" },
  headerCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  headerRow: { display: "flex", gap: 20, alignItems: "center" },
  logo: { width: 120 },
  title: { fontSize: 36, fontWeight: 800 },
  subtitle: { fontSize: 18 },

  tabBar: { display: "flex", gap: 10, marginBottom: 15 },
  tab: { padding: 10, background: "#eee", borderRadius: 10 },
  activeTab: { padding: 10, background: "#7a2638", color: "#fff", borderRadius: 10 },

  card: { background: "#fff", padding: 20, borderRadius: 20 },
  sectionTitle: { fontSize: 28, fontWeight: 800 },
  paragraph: { fontSize: 18 },

  listItem: {
    border: "1px solid #ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  listTitle: { fontWeight: 800, fontSize: 18 },
  listMeta: { fontSize: 14, color: "#555" },

  input: { padding: 10, marginRight: 10 },
  button: { padding: 10, background: "#7a2638", color: "#fff" },

  whatsApp: {
    display: "inline-block",
    marginTop: 5,
    padding: "6px 10px",
    background: "green",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
  },
};
