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

function panelStyle(background = "#fff", border = "#d6d3d1") {
  return {
    background,
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  };
}

function buttonStyle(active = false) {
  return {
    padding: "10px 14px",
    marginRight: 10,
    marginBottom: 10,
    background: active ? "#b45309" : "#eee7df",
    color: active ? "white" : "#222",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600
  };
}

function inputStyle(width = "auto") {
  return {
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    width
  };
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

    const { data, error } = await supabase
      .from("office_bearers")
      .select("*");

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

    const { error } = await supabase.from("events").insert([
      {
        title,
        date_text: date,
        note: ""
      }
    ]);

    if (error) {
      setMessage(`Could not save diary entry: ${error.message}`);
      return;
    }

    setTitle("");
    setDate("");
    setMessage("Diary entry added.");
    loadEntries();
  };

  const deleteEntry = async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete diary entry: ${error.message}`);
      return;
    }

    setMessage("Diary entry deleted.");
    loadEntries();
  };

  const addMember = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    if (!newMemberName) {
      setMessage("Enter member name.");
      return;
    }

    const { error } = await supabase.from("members").insert([
      {
        name: newMemberName,
        section: newMemberSection,
        phone: newMemberPhone,
        email: newMemberEmail
      }
    ]);

    if (error) {
      setMessage(`Could not save member: ${error.message}`);
      return;
    }

    setNewMemberName("");
    setNewMemberSection("Gents");
    setNewMemberPhone("");
    setNewMemberEmail("");
    setMessage("Member added.");
    loadMembers();
  };

  const deleteMember = async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      setMessage(`Could not delete member: ${error.message}`);
      return;
    }

    setMessage("Member deleted.");
    loadMembers();
  };

  const addOfficeBearer = async () => {
    if (!supabase) {
      setMessage("Supabase not connected.");
      return;
    }

    if (!newRole || !newOfficerName) {
      setMessage("Enter role and name.");
      return;
    }

    const { error } = await supabase.from("office_bearers").insert([
      {
        role: newRole,
        name: newOfficerName,
        phone: newOfficerPhone
      }
    ]);

    if (error) {
      setMessage(`Could not save office bearer: ${error.message}`);
      return;
    }

    setNewRole("");
    setNewOfficerName("");
    setNewOfficerPhone("");
    setMessage("Office bearer added.");
    loadOfficeBearers();
  };

  const deleteOfficeBearer = async (id) => {
    if (!supabase) return;

    const { error } = await supabase
      .from("office_bearers")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`Could not delete office bearer: ${error.message}`);
      return;
    }

    setMessage("Office bearer deleted.");
    loadOfficeBearers();
  };

  if (!loggedIn) {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "Arial, sans-serif",
          background: "#f7f3ee",
          minHeight: "100vh"
        }}
      >
        <div style={{ maxWidth: 460, margin: "60px auto", ...panelStyle("#fffaf5") }}>
          <h1 style={{ marginTop: 0, color: "#7c2d12" }}>Woodilee Bowling Club</h1>
          <h2 style={{ marginTop: 0 }}>Members Diary</h2>

          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ ...inputStyle("100%"), boxSizing: "border-box" }}
          />

          <button onClick={handleLogin} style={{ ...buttonStyle(true), width: "100%", marginRight: 0 }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#f7f3ee",
        minHeight: "100vh",
        color: "#222"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ ...panelStyle("#fffaf5"), marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px 0", color: "#7c2d12" }}>Woodilee Bowling Club</h1>
          <h2 style={{ margin: 0 }}>Members Diary</h2>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 15,
              padding: 12,
              background: "#fff3cd",
              border: "1px solid #e0c36c",
              borderRadius: 10
            }}
          >
            {message}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setActiveTab("diary")} style={buttonStyle(activeTab === "diary")}>
            Diary
          </button>

          <button onClick={() => setActiveTab("members")} style={buttonStyle(activeTab === "members")}>
            Members
          </button>

          <button onClick={() => setActiveTab("admin")} style={buttonStyle(activeTab === "admin")}>
            Admin
          </button>
        </div>

        {activeTab === "diary" && (
          <div>
            <div style={{ ...panelStyle("#fffaf5"), marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Office Bearers</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16
                }}
              >
                {uniqueOfficeBearers.map((person) => {
                  const isKeyRole =
                    String(person.role || "").includes("President") ||
                    String(person.role || "").includes("Secretary") ||
                    String(person.role || "").includes("Treasurer");

                  return (
                    <div
                      key={person.id}
                      style={{
                        border: isKeyRole ? "2px solid #d97706" : "1px solid #d6d3d1",
                        borderRadius: 12,
                        padding: 16,
                        background: isKeyRole ? "#fff7ed" : "#ffffff",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
                      }}
                    >
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

                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          marginBottom: 8
                        }}
                      >
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

            <div style={panelStyle("#fff")}>
              <h3 style={{ marginTop: 0 }}>Diary Entries</h3>

              {loading && <p>Loading...</p>}

              <div style={{ display: "grid", gap: 12 }}>
                {entries.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                      background: "#fcfcfc"
                    }}
                  >
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
          <div style={panelStyle("#fff")}>
            <h3 style={{ marginTop: 0 }}>Members List</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    border: "1px solid #d6d3d1",
                    borderRadius: 12,
                    padding: 16,
                    background: "#fcfcfc"
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{member.name}</div>
                  <div style={{ marginTop: 6, color: "#92400e", fontWeight: 700 }}>
                    {member.section}
                  </div>
                  <div style={{ marginTop: 8 }}>{member.phone}</div>
                  <div style={{ marginTop: 4 }}>{member.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            {!adminUnlocked ? (
              <div style={{ maxWidth: 460, ...panelStyle("#fffaf5") }}>
                <h3 style={{ marginTop: 0 }}>Admin Login</h3>

                <input
                  type="password"
                  placeholder="Enter Admin PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={{ ...inputStyle("100%"), boxSizing: "border-box" }}
                />

                <button
                  onClick={handleAdminLogin}
                  style={{ ...buttonStyle(true), width: "100%", marginRight: 0 }}
                >
                  Enter
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Add Diary Entry</h3>

                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    style={inputStyle("240px")}
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={inputStyle("180px")}
                  />

                  <br />

                  <button onClick={addEntry} style={buttonStyle(true)}>
                    Save Diary Entry
                  </button>
                </div>

                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Delete Diary Entry</h3>

                  <div style={{ display: "grid", gap: 10 }}>
                    {entries.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          background: "#fcfcfc"
                        }}
                      >
                        <div>
                          <strong>{item.date_text}</strong> — {item.title}
                        </div>
                        <button onClick={() => deleteEntry(item.id)} style={buttonStyle()}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Add Office Bearer</h3>

                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Role"
                    style={inputStyle("220px")}
                  />

                  <input
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    placeholder="Name"
                    style={inputStyle("220px")}
                  />

                  <input
                    value={newOfficerPhone}
                    onChange={(e) => setNewOfficerPhone(e.target.value)}
                    placeholder="Phone"
                    style={inputStyle("180px")}
                  />

                  <br />

                  <button onClick={addOfficeBearer} style={buttonStyle(true)}>
                    Save Office Bearer
                  </button>
                </div>

                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Delete Office Bearer</h3>

                  <div style={{ display: "grid", gap: 10 }}>
                    {sortedOfficeBearers.map((person) => (
                      <div
                        key={person.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          background: "#fcfcfc"
                        }}
                      >
                        <div>
                          <strong>{person.role}</strong> — {person.name}
                        </div>
                        <button onClick={() => deleteOfficeBearer(person.id)} style={buttonStyle()}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Add Member</h3>

                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    style={inputStyle("220px")}
                  />

                  <select
                    value={newMemberSection}
                    onChange={(e) => setNewMemberSection(e.target.value)}
                    style={inputStyle("180px")}
                  >
                    <option>Gents</option>
                    <option>Ladies</option>
                    <option>Associate</option>
                  </select>

                  <input
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="Phone"
                    style={inputStyle("180px")}
                  />

                  <input
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email"
                    style={inputStyle("220px")}
                  />

                  <br />

                  <button onClick={addMember} style={buttonStyle(true)}>
                    Save Member
                  </button>
                </div>

                <div style={panelStyle("#fff")}>
                  <h3 style={{ marginTop: 0 }}>Delete Member</h3>

                  <div style={{ display: "grid", gap: 10 }}>
                    {members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          background: "#fcfcfc"
                        }}
                      >
                        <div>
                          <strong>{member.name}</strong> — {member.section}
                        </div>
                        <button onClick={() => deleteMember(member.id)} style={buttonStyle()}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}