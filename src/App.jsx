import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

const defaultOfficeBearers = [
  { role: "Gents President", name: "Peter Anderson", phone: "07929 878444" },
  { role: "Ladies President", name: "Rita Gordon", phone: "07806 780022" },
  { role: "Secretary", name: "Peter Barber", phone: "07954 698489" },
  { role: "Treasurer", name: "Trevor Barraclough", phone: "07974 954382" },
  { role: "Bar Convenor", name: "David Munro", phone: "07780 131049" },
];

function panel(bg = "#fff", border = "#202020") {
  return {
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
  };
}

function navButton(active = false) {
  return {
    padding: "10px 16px",
    borderRadius: 14,
    border: "2px solid #222",
    background: active ? "#8f5a2a" : "#fff",
    color: active ? "#fff" : "#222",
    fontWeight: 700,
    cursor: "pointer",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderRadius: 10,
    border: "2px solid #333",
    boxSizing: "border-box",
  };
}

function cleanPhone(phone) {
  if (!phone) return "";
  return String(phone).split(/\s+or\s+/i)[0].replace(/\s+/g, "").trim();
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthLabel(value) {
  if (!value) return "Other";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Other";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function App() {
  const [clubPin, setClubPin] = useState("");
  const [clubUnlocked, setClubUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [page, setPage] = useState("home");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [points, setPoints] = useState([]);
  const [officeBearers, setOfficeBearers] = useState(defaultOfficeBearers);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberSection, setMemberSection] = useState("All");

  const [newMember, setNewMember] = useState({ name: "", section: "Gents", phone: "", email: "" });
  const [newEvent, setNewEvent] = useState({ date_text: "", title: "", note: "" });
  const [newPoint, setNewPoint] = useState({ member_name: "", week_date: "", points: "" });
  const [officeDraft, setOfficeDraft] = useState(defaultOfficeBearers);

  useEffect(() => {
    if (!clubUnlocked || !supabase) return;

    let dead = false;

    async function loadAll() {
      setLoading(true);
      const [membersRes, eventsRes, pointsRes] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("events").select("*").order("date_text"),
        supabase.from("monday_points").select("*").order("week_date"),
      ]);

      if (dead) return;

      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setPoints(Array.isArray(pointsRes.data) ? pointsRes.data : []);

      if (membersRes.error || eventsRes.error || pointsRes.error) {
        setMessage("Some live data could not be loaded. Check Supabase tables and policies.");
      } else {
        setMessage("");
      }

      setLoading(false);
    }

    loadAll();

    const channel = supabase
      .channel("woodilee-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "monday_points" }, loadAll)
      .subscribe();

    return () => {
      dead = true;
      supabase.removeChannel(channel);
    };
  }, [clubUnlocked]);

  const memberCounts = useMemo(() => ({
    All: members.length,
    Gents: members.filter((m) => m.section === "Gents").length,
    Ladies: members.filter((m) => m.section === "Ladies").length,
    Associate: members.filter((m) => m.section === "Associate").length,
  }), [members]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return members.filter((m) => {
      const sectionOk = memberSection === "All" || m.section === memberSection;
      const hay = [m.name, m.section, m.phone, m.email].filter(Boolean).join(" ").toLowerCase();
      return sectionOk && (!q || hay.includes(q));
    });
  }, [members, memberSearch, memberSection]);

  const groupedMembers = useMemo(() => {
    return filteredMembers.reduce((acc, member) => {
      const key = member.section || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(member);
      return acc;
    }, {});
  }, [filteredMembers]);

  const groupedEvents = useMemo(() => {
    return events.reduce((acc, event) => {
      const key = monthLabel(event.date_text);
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  const leaderboard = useMemo(() => {
    const totals = {};
    points.forEach((row) => {
      const name = String(row.member_name || "").trim();
      if (!name) return;
      totals[name] = (totals[name] || 0) + Number(row.points || 0);
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      .map((row, i) => ({ ...row, position: i + 1 }));
  }, [points]);

  const weeklyWinners = useMemo(() => {
    const byWeek = {};
    points.forEach((row) => {
      const week = row.week_date;
      if (!week) return;
      if (!byWeek[week]) byWeek[week] = [];
      byWeek[week].push({ member_name: row.member_name, points: Number(row.points || 0) });
    });

    return Object.entries(byWeek)
      .map(([week, rows]) => {
        const sorted = [...rows].sort((a, b) => b.points - a.points || String(a.member_name || "").localeCompare(String(b.member_name || "")));
        return {
          week,
          winner: sorted[0]?.member_name || "",
          topScore: sorted[0]?.points || 0,
        };
      })
      .sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [points]);

  async function addMember() {
    if (!supabase) return setMessage("Supabase not connected.");
    if (!newMember.name) return setMessage("Enter member name.");
    const { error } = await supabase.from("members").insert([newMember]);
    if (error) return setMessage("Could not save member.");
    setNewMember({ name: "", section: "Gents", phone: "", email: "" });
    setMessage("Member added.");
  }

  async function addEvent() {
    if (!supabase) return setMessage("Supabase not connected.");
    if (!newEvent.date_text || !newEvent.title) return setMessage("Enter event date and title.");
    const { error } = await supabase.from("events").insert([newEvent]);
    if (error) return setMessage("Could not save event.");
    setNewEvent({ date_text: "", title: "", note: "" });
    setMessage("Event added.");
  }

  async function addPoint() {
    if (!supabase) return setMessage("Supabase not connected.");
    if (!newPoint.member_name || !newPoint.week_date) return setMessage("Enter member and week date.");
    const { error } = await supabase.from("monday_points").insert([
      { ...newPoint, points: Number(newPoint.points || 0) },
    ]);
    if (error) return setMessage("Could not save Monday points.");
    setNewPoint({ member_name: "", week_date: "", points: "" });
    setMessage("Monday points added.");
  }

  function saveOfficeBearers() {
    setOfficeBearers(officeDraft);
    setMessage("Office bearers updated in app.");
  }

  if (!clubUnlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5efe1", padding: 24, fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "60px auto", ...panel() }}>
          <div style={{ textAlign: "center", fontSize: 38, fontWeight: 800 }}>Woodilee Bowling Club</div>
          <div style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "#8b1e1e", marginTop: 8 }}>Members’ Diary</div>
          <div style={{ textAlign: "center", marginTop: 20 }}>Enter club PIN</div>
          <input type="password" value={clubPin} onChange={(e) => setClubPin(e.target.value)} style={{ ...inputStyle(), marginTop: 14 }} />
          <button
            style={{ ...navButton(true), width: "100%", marginTop: 14 }}
            onClick={() => {
              if (clubPin === CLUB_PIN) {
                setClubUnlocked(true);
                setMessage("");
              } else {
                setMessage("Incorrect club PIN.");
              }
            }}
          >
            Open Diary
          </button>
          {message ? <div style={{ marginTop: 14, color: "#b42318", fontWeight: 700, textAlign: "center" }}>{message}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5efe1", padding: 18, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ border: "4px solid #111", background: "#d98f4e", padding: 8, borderRadius: 14 }}>
          <div style={{ border: "2px solid #111", background: "#efdfc7", padding: 10, borderRadius: 10 }}>
            <div style={{ ...panel(), boxShadow: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 40, fontWeight: 800 }}>Woodilee Bowling Club</div>
                  <div style={{ marginTop: 6, fontSize: 24, color: "#8b1e1e", fontWeight: 700 }}>Members’ Diary</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={navButton(page === "home")} onClick={() => setPage("home")}>Home</button>
                  <button style={navButton(page === "diary")} onClick={() => setPage("diary")}>Diary</button>
                  <button style={navButton(page === "members")} onClick={() => setPage("members")}>Members</button>
                  <button style={navButton(page === "office")} onClick={() => setPage("office")}>Office Bearers</button>
                  <button style={navButton(page === "points")} onClick={() => setPage("points")}>Monday Points</button>
                  <button style={navButton(page === "admin")} onClick={() => setPage("admin")}>Admin</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message ? <div style={{ ...panel("#fff8e8"), marginTop: 16 }}>{message}</div> : null}
        {!supabase ? <div style={{ ...panel("#fff5f5", "#d33"), marginTop: 16 }}>Supabase keys are missing in Vercel environment variables.</div> : null}
        {loading ? <div style={{ marginTop: 16, fontWeight: 700, color: "#666" }}>Loading…</div> : null}

        {page === "home" ? (
          <div style={{ ...panel("#fffaf2"), marginTop: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Club Dashboard</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div style={panel("#fff")}><div style={{ fontSize: 14, color: "#8f5a2a", fontWeight: 700 }}>Members</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{members.length}</div></div>
              <div style={panel("#fff")}><div style={{ fontSize: 14, color: "#8f5a2a", fontWeight: 700 }}>Diary Events</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{events.length}</div></div>
              <div style={panel("#fff")}><div style={{ fontSize: 14, color: "#8f5a2a", fontWeight: 700 }}>Monday Players</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{leaderboard.length}</div></div>
              <div style={panel("#fff1b8")}><div style={{ fontSize: 14, color: "#8f5a2a", fontWeight: 700 }}>Current Leader</div><div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{leaderboard[0]?.name || "None yet"}</div></div>
            </div>
          </div>
        ) : null}

        {page === "diary" ? (
          <div style={{ ...panel("#fffaf2"), marginTop: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Diary</div>
            {Object.keys(groupedEvents).length === 0 ? <div>No diary events yet.</div> : null}
            <div style={{ display: "grid", gap: 18 }}>
              {Object.entries(groupedEvents).map(([month, items]) => (
                <div key={month}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#8f5a2a", marginBottom: 10 }}>{month}</div>
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                    {items.map((ev, i) => (
                      <div key={ev.id || i} style={panel("#fffdf8")}>
                        <div style={{ color: "#8f5a2a", fontWeight: 700 }}>{ev.date_text}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{ev.title}</div>
                        {ev.note ? <div style={{ marginTop: 6 }}>{ev.note}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {page === "members" ? (
          <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
            <div style={panel("#fffaf2")}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>Members Directory</div>
                <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search member, phone or email" style={{ ...inputStyle(), minWidth: 260, width: 320 }} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {Object.entries(memberCounts).map(([section, count]) => (
                  <button key={section} onClick={() => setMemberSection(section)} style={navButton(memberSection === section)}>{section} ({count})</button>
                ))}
              </div>
            </div>
            {Object.entries(groupedMembers).map(([section, items]) => (
              <div key={section}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#8f5a2a", marginBottom: 10 }}>{section}</div>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {items.map((m, i) => (
                    <div key={m.id || i} style={panel("#fff")}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{m.name}</div>
                      <div style={{ color: "#8f5a2a", fontWeight: 700, marginTop: 4 }}>{m.section}</div>
                      {m.phone ? <a href={`tel:${cleanPhone(m.phone)}`} style={{ display: "block", marginTop: 8 }}>{m.phone}</a> : null}
                      {m.email ? <div style={{ marginTop: 6 }}>{m.email}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {page === "office" ? (
          <div style={{ ...panel("#fffaf2"), marginTop: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Office Bearers</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {officeBearers.map((p, i) => (
                <div key={i} style={panel("#fff")}>
                  <div style={{ color: "#8f5a2a", fontWeight: 700 }}>{p.role}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{p.name}</div>
                  <div style={{ marginTop: 8 }}>{p.phone}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {page === "points" ? (
          <div style={{ marginTop: 20, display: "grid", gap: 18 }}>
            <div style={panel("#fffaf2")}>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Monday Points Leaderboard</div>
              {leaderboard.length === 0 ? <div>No Monday points yet.</div> : leaderboard.map((row) => (
                <div key={row.name} style={{ ...panel(row.position === 1 ? "#fff1b8" : "#fff"), marginTop: 10, display: "grid", gridTemplateColumns: "70px 1fr 100px", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{row.position}</div>
                  <div style={{ fontWeight: 700 }}>{row.name}</div>
                  <div style={{ textAlign: "right", fontWeight: 800 }}>{row.total}</div>
                </div>
              ))}
            </div>

            <div style={panel("#fffaf2")}>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Weekly Winners</div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {weeklyWinners.map((item, i) => (
                  <div key={i} style={panel("#fff")}>
                    <div style={{ color: "#8f5a2a", fontWeight: 700 }}>{formatDate(item.week)}</div>
                    <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{item.winner || "No winner"}</div>
                    <div style={{ marginTop: 4 }}>Top score: {item.topScore}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {page === "admin" ? (
          <div style={{ marginTop: 20 }}>
            {!adminUnlocked ? (
              <div style={{ maxWidth: 480, ...panel("#fffaf2") }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>Admin Access</div>
                <div style={{ marginTop: 8 }}>Enter admin PIN</div>
                <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} style={{ ...inputStyle(), marginTop: 14 }} />
                <button
                  style={{ ...navButton(true), width: "100%", marginTop: 14 }}
                  onClick={() => {
                    if (adminPin === ADMIN_PIN) {
                      setAdminUnlocked(true);
                      setMessage("Admin unlocked.");
                    } else {
                      setMessage("Incorrect admin PIN.");
                    }
                  }}
                >
                  Unlock Admin
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                <div style={panel("#fffaf2")}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Add Event</div>
                  <input value={newEvent.date_text} onChange={(e) => setNewEvent((p) => ({ ...p, date_text: e.target.value }))} placeholder="Date" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <input value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} placeholder="Title" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <textarea value={newEvent.note} onChange={(e) => setNewEvent((p) => ({ ...p, note: e.target.value }))} placeholder="Note" rows={4} style={{ ...inputStyle(), resize: "vertical" }} />
                  <div style={{ height: 8 }} />
                  <button style={navButton(true)} onClick={addEvent}>Save Event</button>
                </div>

                <div style={panel("#fffaf2")}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Add Member</div>
                  <input value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} placeholder="Member name" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <select value={newMember.section} onChange={(e) => setNewMember((p) => ({ ...p, section: e.target.value }))} style={inputStyle()}>
                    <option>Gents</option>
                    <option>Ladies</option>
                    <option>Associate</option>
                  </select>
                  <div style={{ height: 8 }} />
                  <input value={newMember.phone} onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <input value={newMember.email} onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))} placeholder="Email" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <button style={navButton(true)} onClick={addMember}>Save Member</button>
                </div>

                <div style={panel("#fffaf2")}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Add Monday Points</div>
                  <input value={newPoint.member_name} onChange={(e) => setNewPoint((p) => ({ ...p, member_name: e.target.value }))} placeholder="Member name" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <input value={newPoint.week_date} onChange={(e) => setNewPoint((p) => ({ ...p, week_date: e.target.value }))} type="date" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <input value={newPoint.points} onChange={(e) => setNewPoint((p) => ({ ...p, points: e.target.value }))} placeholder="Points" type="number" style={inputStyle()} />
                  <div style={{ height: 8 }} />
                  <button style={navButton(true)} onClick={addPoint}>Save Points</button>
                </div>

                <div style={panel("#fffaf2")}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Office Bearers</div>
                  {officeDraft.map((item, i) => (
                    <div key={i} style={{ ...panel("#fff"), marginBottom: 8 }}>
                      <input value={item.role} onChange={(e) => setOfficeDraft((prev) => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} placeholder="Role" style={inputStyle()} />
                      <div style={{ height: 8 }} />
                      <input value={item.name} onChange={(e) => setOfficeDraft((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Name" style={inputStyle()} />
                      <div style={{ height: 8 }} />
                      <input value={item.phone} onChange={(e) => setOfficeDraft((prev) => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} placeholder="Phone" style={inputStyle()} />
                    </div>
                  ))}
                  <button style={navButton(true)} onClick={saveOfficeBearers}>Save Office Bearers</button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
