import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

const officeRoleOrder = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Vice President": 4,
  "Bar Convenor": 5
};

function getOfficeRolePriority(role) {
  const roleText = String(role || "");
  const match = Object.keys(officeRoleOrder).find((key) =>
    roleText.includes(key)
  );
  return match ? officeRoleOrder[match] : 99;
}

function sortOfficeBearers(list) {
  return [...list].sort((a, b) => {
    const aPriority = getOfficeRolePriority(a.role);
    const bPriority = getOfficeRolePriority(b.role);

    if (aPriority !== bPriority) return aPriority - bPriority;
    return String(a.role || "").localeCompare(String(b.role || ""));
  });
}

const styles = {
  page: {
    padding: 16,
    fontFamily: "Arial, sans-serif",
    background: "#f7f3ee",
    minHeight: "100vh",
    color: "#222"
  },
  wrap: {
    maxWidth: 1100,
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
    fontSize: 34
  },
  subtitle: {
    margin: 0,
    fontSize: 24
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  tabButton: (active) => ({
    padding: "12px 16px",
    background: active ? "#b45309" : "#eee7df",
    color: active ? "#fff" : "#222",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    minHeight: 46
  }),
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    boxSizing: "border-box",
    fontSize: 16
  },
  actionButton: {
    padding: "12px 16px",
    background: "#b45309",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    minHeight: 46
  },
  smallButton: {
    padding: "10px 12px",
    background: "#eee7df",
    color: "#222",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14
  },
  card: {
    border: "1px solid #d6d3d1",
    borderRadius: 14,
    padding: 16,
    background: "#fcfcfc"
  },
  keyCard: {
    border: "2px solid #d97706",
    borderRadius: 14,
    padding: 16,
    background: "#fff7ed",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
  },
  message: {
    marginBottom: 15,
    padding: 12,
    background: "#fff3cd",
    border: "1px solid #e0c36c",
    borderRadius: 10
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#fcfcfc",
    marginBottom: 10,
    flexWrap: "wrap"
  }
};

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
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const [newRole, setNewRole] = useState("");
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");

  const [loading, setLoading] = useState(false);

  const sortedOfficeBearers = useMemo(
    () => sortOfficeBearers(officeBearers),
    [officeBearers]
  );

  const uniqueOfficeBearers = useMemo(() => {
    const seen = new Set();
    return sortedOfficeBearers.filter((person) => {
      const key = `${String(person.role || "").trim().toLowerCase()}|${String(
        person.name || ""
      )
        .trim()
        .toLowerCase()}|${String(person.phone || "")
        .trim()
        .toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sortedOfficeBearers]);

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
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date_text", { ascending: true });

    if (error) {
      setMessage(`Could not load diary entries: ${error.message}`);
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
      setMessage(`Could not load members: ${error.message}`);
    } else {
      setMembers(data || []);
    }
  };

  const loadOfficeBearers = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    const { data, error } = await supabase.from("office_bearers").select("*");

    if (error) {
      setMessage(`Could not load office bearers: ${error.message}`);
    } else {
      setOfficeBearers(data || []);
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

    const { data, error } = await supabase
      .from("events")
      .insert([{ title, date_text: date, note: "" }])
      .select()
      .single();

    if (error) {
      setMessage(`Could not save diary entry: ${error.message}`);
      return;
    }

    setEntries((prev) =>
      [...prev, data].sort((a, b) =>
        String(a.date_text || "").localeCompare(String(b.date_text || ""))
      )
    );
    setTitle("");
    setDate("");
    setMessage("Diary entry added.");
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete diary entry: ${error.message}`);
      return;
    }

    setEntries((prev) => prev.filter((item) => item.id !== id));
    setMessage("Diary entry deleted.");
  };

  const addMember = async () => {
    if (!newMemberName) {
      setMessage("Enter member name.");
      return;
    }

    const { data, error } = await supabase
      .from("members")
      .insert([
        {
          name: newMemberName,
          section: newMemberSection,
          phone: newMemberPhone,
          email: newMemberEmail
        }
      ])
      .select()
      .single();

    if (error) {
      setMessage(`Could not save member: ${error.message}`);
      return;
    }

    setMembers((prev) =>
      [...prev, data].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      )
    );
    setNewMemberName("");
    setNewMemberSection("Gents");
    setNewMemberPhone("");
    setNewMemberEmail("");
    setMessage("Member added.");
  };

  const deleteMember = async (id) => {
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete member: ${error.message}`);
      return;
    }

    setMembers((prev) => prev.filter((member) => member.id !== id));
    setMessage("Member deleted.");
  };

  const addOfficeBearer = async () => {
    if (!newRole || !newOfficerName) {
      setMessage("Enter role and name.");
      return;
    }

    const { data, error } = await supabase
      .from("office_bearers")
      .insert([
        {
          role: newRole,
          name: newOfficerName,
          phone: newOfficerPhone
        }
      ])
      .select()
      .single();

    if (error) {
      setMessage(`Could not save office bearer: ${error.message}`);
      return;
    }

    setOfficeBearers((prev) => [...prev, data]);
    setNewRole("");
    setNewOfficerName("");
    setNewOfficerPhone("");
    setMessage("Office bearer added.");
  };

  const deleteOfficeBearer = async (id) => {
    const { error } = await supabase
      .from("office_bearers")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`Could not delete office bearer: ${error.message}`);
      return;
    }

    setOfficeBearers((prev) => prev.filter((person) => person.id !== id));
    setMessage("Office bearer deleted.");
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={{ maxWidth: 460, margin: "40px auto", ...styles.warmPanel }}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <h2 style={styles.subtitle}>Members Diary</h2>

          <div style={{ marginTop: 16 }}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleLogin} style={{ ...styles.actionButton, width: "100%" }}>
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={{ ...styles.warmPanel, marginBottom: 20 }}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <h2 style={styles.subtitle}>Members Diary</h2>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.tabs}>
          <button onClick={() => setActiveTab("diary")} style={styles.tabButton(activeTab === "diary")}>
            Diary
          </button>
          <button onClick={() => setActiveTab("members")} style={styles.tabButton(activeTab === "members")}>
            Members
          </button>
          <button onClick={() => setActiveTab("admin")} style={styles.tabButton(activeTab === "admin")}>
            Admin
          </button>
        </div>

        {activeTab === "diary" && (
          <div>
            <div style={{ ...styles.warmPanel, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Office Bearers</h3>

              <div style={styles.grid}>
                {uniqueOfficeBearers.map((person) => {
                  const isKeyRole =
                    String(person.role || "").includes("President") ||
                    String(person.role || "").includes("Secretary") ||
                    String(person.role || "").includes("Treasurer");

                  return (
                    <div key={person.id} style={isKeyRole ? styles.keyCard : styles.card}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: "bold",
                          color: isKeyRole ? "#b45309" : "#666",
                          marginBottom: 8,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}
                      >
                        {person.role}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
                        {person.name}
                      </div>
                      <div style={{ color: "#444" }}>
                        {person.phone || "No phone listed"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.panel}>
              <h3 style={{ marginTop: 0 }}>Diary Entries</h3>
              {loading && <p>Loading...</p>}

              <div style={{ display: "grid", gap: 12 }}>
                {entries.map((item) => (
                  <div key={item.id} style={styles.card}>
                    <div style={{ fontSize: 14, color: "#92400e", fontWeight: 700 }}>
                      {item.date_text}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div style={styles.panel}>
            <h3 style={{ marginTop: 0 }}>Members List</h3>

            <div style={styles.grid}>
              {members.map((member) => (
                <div key={member.id} style={styles.card}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{member.name}</div>
                  <div style={{ marginTop: 6, color: "#92400e", fontWeight: 700 }}>
                    {member.section}
                  </div>
                  <div style={{ marginTop: 8 }}>{member.phone}</div>
                  <div style={{ marginTop: 4, wordBreak: "break-word" }}>{member.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            {!adminUnlocked ? (
              <div style={{ maxWidth: 460, ...styles.warmPanel }}>
                <h3 style={{ marginTop: 0 }}>Admin Login</h3>
                <input
                  type="password"
                  placeholder="Enter Admin PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handleAdminLogin} style={{ ...styles.actionButton, width: "100%" }}>
                  Enter
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Add Diary Entry</h3>
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
                  <button onClick={addEntry} style={styles.actionButton}>
                    Save Diary Entry
                  </button>
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Delete Diary Entry</h3>
                  {entries.map((item) => (
                    <div key={item.id} style={styles.listRow}>
                      <div>
                        <strong>{item.date_text}</strong> — {item.title}
                      </div>
                      <button onClick={() => deleteEntry(item.id)} style={styles.smallButton}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Add Office Bearer</h3>
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
                  <button onClick={addOfficeBearer} style={styles.actionButton}>
                    Save Office Bearer
                  </button>
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Delete Office Bearer</h3>
                  {sortedOfficeBearers.map((person) => (
                    <div key={person.id} style={styles.listRow}>
                      <div>
                        <strong>{person.role}</strong> — {person.name}
                      </div>
                      <button onClick={() => deleteOfficeBearer(person.id)} style={styles.smallButton}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Add Member</h3>
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
                  <input
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="Phone"
                    style={styles.input}
                  />
                  <input
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email"
                    style={styles.input}
                  />
                  <button onClick={addMember} style={styles.actionButton}>
                    Save Member
                  </button>
                </div>

                <div style={styles.panel}>
                  <h3 style={{ marginTop: 0 }}>Delete Member</h3>
                  {members.map((member) => (
                    <div key={member.id} style={styles.listRow}>
                      <div>
                        <strong>{member.name}</strong> — {member.section}
                      </div>
                      <button onClick={() => deleteMember(member.id)} style={styles.smallButton}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}