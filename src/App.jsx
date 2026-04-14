import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

const styles = {
  page: {
    padding: 16,
    fontFamily: "Arial, sans-serif",
    background: "#f7f3ee",
    minHeight: "100vh",
    color: "#222"
  },
  wrap: {
    maxWidth: 1000,
    margin: "0 auto"
  },
  panel: {
    background: "#fff",
    border: "1px solid #d6d3d1",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  warmPanel: {
    background: "#fffaf5",
    border: "1px solid #d6d3d1",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  title: {
    margin: "0 0 6px 0",
    color: "#7c2d12",
    fontSize: 32
  },
  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap"
  },
  tab: (active) => ({
    padding: "12px 16px",
    background: active ? "#b45309" : "#eee7df",
    color: active ? "#fff" : "#222",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer"
  }),
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box"
  },
  button: {
    padding: "12px 16px",
    background: "#b45309",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8
  },
  smallBtn: {
    padding: "8px 10px",
    background: "#eee7df",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    marginLeft: 8
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#fcfcfc",
    marginBottom: 10
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14
  },
  message: {
    marginBottom: 15,
    padding: 12,
    background: "#fff3cd",
    border: "1px solid #e0c36c",
    borderRadius: 10
  }
};

function sortEventsChronologically(list) {
  return [...list].sort((a, b) => {
    const aDate = new Date(a.date_text);
    const bDate = new Date(b.date_text);
    return aDate - bDate;
  });
}

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("diary");

  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSection, setNewMemberSection] = useState("Gents");

  const [newRole, setNewRole] = useState("");
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingOfficerId, setEditingOfficerId] = useState(null);

  const sortedEntries = useMemo(() => sortEventsChronologically(entries), [entries]);

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
    loadOfficeBearers();
  }, [loggedIn]);

  const loadEntries = async () => {
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      setMessage(`Could not load diary entries: ${error.message}`);
      return;
    }
    setEntries(data || []);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase.from("members").select("*").order("name", { ascending: true });
    if (error) {
      setMessage(`Could not load members: ${error.message}`);
      return;
    }
    setMembers(data || []);
  };

  const loadOfficeBearers = async () => {
    const { data, error } = await supabase.from("office_bearers").select("*").order("role", { ascending: true });
    if (error) {
      setMessage(`Could not load office bearers: ${error.message}`);
      return;
    }
    setOfficeBearers(data || []);
  };

  const saveEntry = async () => {
    if (!title || !date) {
      setMessage("Enter event title and date.");
      return;
    }

    if (editingEntryId) {
      const { data, error } = await supabase
        .from("events")
        .update({ title, date_text: date })
        .eq("id", editingEntryId)
        .select()
        .single();

      if (error) {
        setMessage(`Could not update diary entry: ${error.message}`);
        return;
      }

      setEntries((prev) => prev.map((x) => (x.id === editingEntryId ? data : x)));
      setMessage("Diary entry updated.");
      setEditingEntryId(null);
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert([{ title, date_text: date, note: "" }])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save diary entry: ${error.message}`);
        return;
      }

      setEntries((prev) => [...prev, data]);
      setMessage("Diary entry added.");
    }

    setTitle("");
    setDate("");
  };

  const editEntry = (entry) => {
    setEditingEntryId(entry.id);
    setTitle(entry.title || "");
    setDate(entry.date_text || "");
    setActiveTab("admin");
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete diary entry: ${error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((x) => x.id !== id));
    setMessage("Diary entry deleted.");
  };

  const saveMember = async () => {
    if (!newMemberName) {
      setMessage("Enter member name.");
      return;
    }

    if (editingMemberId) {
      const { data, error } = await supabase
        .from("members")
        .update({ name: newMemberName, section: newMemberSection })
        .eq("id", editingMemberId)
        .select()
        .single();

      if (error) {
        setMessage(`Could not update member: ${error.message}`);
        return;
      }

      setMembers((prev) => prev.map((x) => (x.id === editingMemberId ? data : x)));
      setMessage("Member updated.");
      setEditingMemberId(null);
    } else {
      const { data, error } = await supabase
        .from("members")
        .insert([{ name: newMemberName, section: newMemberSection }])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save member: ${error.message}`);
        return;
      }

      setMembers((prev) => [...prev, data].sort((a, b) => String(a.name).localeCompare(String(b.name))));
      setMessage("Member added.");
    }

    setNewMemberName("");
    setNewMemberSection("Gents");
  };

  const editMember = (member) => {
    setEditingMemberId(member.id);
    setNewMemberName(member.name || "");
    setNewMemberSection(member.section || "Gents");
    setActiveTab("admin");
  };

  const deleteMember = async (id) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete member: ${error.message}`);
      return;
    }
    setMembers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Member deleted.");
  };

  const saveOfficeBearer = async () => {
    if (!newRole || !newOfficerName) {
      setMessage("Enter role and name.");
      return;
    }

    if (editingOfficerId) {
      const { data, error } = await supabase
        .from("office_bearers")
        .update({ role: newRole, name: newOfficerName, phone: newOfficerPhone })
        .eq("id", editingOfficerId)
        .select()
        .single();

      if (error) {
        setMessage(`Could not update office bearer: ${error.message}`);
        return;
      }

      setOfficeBearers((prev) => prev.map((x) => (x.id === editingOfficerId ? data : x)));
      setMessage("Office bearer updated.");
      setEditingOfficerId(null);
    } else {
      const { data, error } = await supabase
        .from("office_bearers")
        .insert([{ role: newRole, name: newOfficerName, phone: newOfficerPhone }])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save office bearer: ${error.message}`);
        return;
      }

      setOfficeBearers((prev) => [...prev, data]);
      setMessage("Office bearer added.");
    }

    setNewRole("");
    setNewOfficerName("");
    setNewOfficerPhone("");
  };

  const editOfficeBearer = (person) => {
    setEditingOfficerId(person.id);
    setNewRole(person.role || "");
    setNewOfficerName(person.name || "");
    setNewOfficerPhone(person.phone || "");
    setActiveTab("admin");
  };

  const deleteOfficeBearer = async (id) => {
    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete office bearer: ${error.message}`);
      return;
    }
    setOfficeBearers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Office bearer deleted.");
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.warmPanel, maxWidth: 420, margin: "60px auto" }}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.button}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ ...styles.warmPanel, marginBottom: 20 }}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === "diary")} onClick={() => setActiveTab("diary")}>Diary</button>
          <button style={styles.tab(activeTab === "members")} onClick={() => setActiveTab("members")}>Members</button>
          <button style={styles.tab(activeTab === "admin")} onClick={() => setActiveTab("admin")}>Admin</button>
        </div>

        {activeTab === "diary" && (
          <>
            <div style={{ ...styles.panel, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Office Bearers</h3>
              <div style={styles.grid}>
                {officeBearers.map((person) => (
                  <div key={person.id} style={styles.card}>
                    <div><strong>{person.role}</strong></div>
                    <div>{person.name}</div>
                    <div>{person.phone}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.panel}>
              <h3 style={{ marginTop: 0 }}>Diary Events</h3>
              {sortedEntries.map((e) => (
                <div key={e.id} style={styles.card}>
                  <strong>{e.date_text}</strong> — {e.title}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "members" && (
          <div style={styles.panel}>
            <h3 style={{ marginTop: 0 }}>Members</h3>
            {members.map((m) => (
              <div key={m.id} style={styles.card}>
                <strong>{m.name}</strong> — {m.section}
              </div>
            ))}
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            {!adminUnlocked ? (
              <div style={{ ...styles.panel, maxWidth: 420 }}>
                <h3 style={{ marginTop: 0 }}>Admin Login</h3>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handleAdminLogin} style={styles.button}>Enter</button>
              </div>
            ) : (
              <>
                <div style={{ ...styles.panel, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>{editingEntryId ? "Edit Diary Entry" : "Add Diary Entry"}</h3>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    style={styles.input}
                  />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={styles.input}
                  />
                  <button onClick={saveEntry} style={styles.button}>
                    {editingEntryId ? "Update Diary Entry" : "Save Diary Entry"}
                  </button>
                </div>

                <div style={{ ...styles.panel, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>Manage Diary Entries</h3>
                  {sortedEntries.map((e) => (
                    <div key={e.id} style={styles.card}>
                      <strong>{e.date_text}</strong> — {e.title}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editEntry(e)} style={styles.smallBtn}>Edit</button>
                        <button onClick={() => deleteEntry(e.id)} style={styles.smallBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ ...styles.panel, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>{editingOfficerId ? "Edit Office Bearer" : "Add Office Bearer"}</h3>
                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Role"
                    style={styles.input}
                  />
                  <input
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    placeholder="Name"
                    style={styles.input}
                  />
                  <input
                    value={newOfficerPhone}
                    onChange={(e) => setNewOfficerPhone(e.target.value)}
                    placeholder="Phone"
                    style={styles.input}
                  />
                  <button onClick={saveOfficeBearer} style={styles.button}>
                    {editingOfficerId ? "Update Office Bearer" : "Save Office Bearer"}
                  </button>
                </div>

                <div style={{ ...styles.panel, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>Manage Office Bearers</h3>
                  {officeBearers.map((person) => (
                    <div key={person.id} style={styles.card}>
                      <strong>{person.role}</strong> — {person.name}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editOfficeBearer(person)} style={styles.smallBtn}>Edit</button>
                        <button onClick={() => deleteOfficeBearer(person.id)} style={styles.smallBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ ...styles.panel, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>{editingMemberId ? "Edit Member" : "Add Member"}</h3>
                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    style={styles.input}
                  />
                  <select
                    value={newMemberSection}
                    onChange={(e) => setNewMemberSection(e.target.value)}
                    style={styles.input}
                  >
                    <option>Gents</option>
                    <option>Ladies</option>
                    <option>Associate</option>
                  </select>
                  <button onClick={saveMember} style={styles.button}>
                    {editingMemberId ? "Update Member" : "Save Member"}
                  </button>
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Manage Members</h3>
                  {members.map((m) => (
                    <div key={m.id} style={styles.card}>
                      <strong>{m.name}</strong> — {m.section}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editMember(m)} style={styles.smallBtn}>Edit</button>
                        <button onClick={() => deleteMember(m.id)} style={styles.smallBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}