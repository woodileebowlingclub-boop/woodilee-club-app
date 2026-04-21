import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/WBC Logo.png";

const ADMIN_PIN = "1954";
const CLUB_NAME = "Woodilee Bowling Club";
const CLUB_SUBTITLE = "Members diary, notices and club information";
const BUCKET = "club-files";

const TABS = [
  { key: "home", label: "Home" },
  { key: "diary", label: "Diary" },
  { key: "notices", label: "Noticeboard" },
  { key: "members", label: "Members" },
  { key: "office", label: "Office Bearers" },
  { key: "coaches", label: "Club Coaches" },
  { key: "documents", label: "Documents" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDayNameFromDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

function getWeeklyDates(startDateStr, repeatUntilStr) {
  const dates = [];
  if (!startDateStr) return dates;

  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return dates;

  dates.push(toDateOnlyString(start));

  if (!repeatUntilStr) return dates;

  const until = new Date(repeatUntilStr);
  if (Number.isNaN(until.getTime())) return dates;

  let next = addDays(start, 7);
  while (next <= until) {
    dates.push(toDateOnlyString(next));
    next = addDays(next, 7);
  }

  return dates;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    event_date: "",
    event_time: "",
    details: "",
    repeat_type: "none",
    repeat_until: "",
  });

  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
  });

  const [newMember, setNewMember] = useState({
    full_name: "",
    phone: "",
    email: "",
    category: "Gents",
  });

  const [newOfficeBearer, setNewOfficeBearer] = useState({
    role: "",
    name: "",
    phone: "",
    email: "",
  });

  const [newCoach, setNewCoach] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setErrorMessage("");

    await Promise.all([
      loadEvents(),
      loadNotices(),
      loadMembers(),
      loadOfficeBearers(),
      loadCoaches(),
      loadDocuments(),
    ]);

    setLoading(false);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    if (error) {
      setErrorMessage(error.message || "Could not load events.");
      return;
    }

    setEvents(data || []);
  }

  async function loadNotices() {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setNotices(data || []);
  }

  async function loadMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error) setMembers(data || []);
  }

  async function loadOfficeBearers() {
    const { data, error } = await supabase
      .from("office_bearers")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error) setOfficeBearers(data || []);
  }

  async function loadCoaches() {
    const { data, error } = await supabase
      .from("coaches")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setCoaches(data || []);
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setDocuments(data || []);
  }

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...events]
      .filter((event) => {
        if (!event.event_date) return false;
        const d = new Date(event.event_date);
        return !Number.isNaN(d.getTime()) && d >= today;
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.event_date}T${a.event_time || "00:00"}`);
        const bDate = new Date(`${b.event_date}T${b.event_time || "00:00"}`);
        return aDate - bDate;
      });
  }, [events]);

  const nextUpcomingEvent =
    upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  const latestNotices = notices.slice(0, 5);

  const gentsMembers = members.filter(
    (m) => safeString(m.category).toLowerCase() === "gents"
  );
  const ladiesMembers = members.filter(
    (m) => safeString(m.category).toLowerCase() === "ladies"
  );
  const associateMembers = members.filter(
    (m) => safeString(m.category).toLowerCase() === "associate"
  );

  async function handleAdminLogin() {
    if (adminPinInput === ADMIN_PIN) {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminPinInput("");
    } else {
      alert("Incorrect admin PIN.");
    }
  }

  function handleAdminLogout() {
    setAdminMode(false);
  }

  async function addEvent() {
    if (!newEvent.title || !newEvent.event_date) {
      alert("Please add at least a title and date.");
      return;
    }

    let eventDates = [newEvent.event_date];

    if (newEvent.repeat_type === "weekly") {
      if (!newEvent.repeat_until) {
        alert("Please choose a repeat until date.");
        return;
      }

      if (new Date(newEvent.repeat_until) < new Date(newEvent.event_date)) {
        alert("Repeat until date must be after the first event date.");
        return;
      }

      eventDates = getWeeklyDates(newEvent.event_date, newEvent.repeat_until);
    }

    const rows = eventDates.map((dateStr) => ({
      title: newEvent.title,
      event_date: dateStr,
      event_time: newEvent.event_time || null,
      details: newEvent.details || null,
    }));

    const { error } = await supabase.from("events").insert(rows);

    if (error) {
      alert(error.message || "Could not add event.");
      return;
    }

    setNewEvent({
      title: "",
      event_date: "",
      event_time: "",
      details: "",
      repeat_type: "none",
      repeat_until: "",
    });

    await loadEvents();

    if (rows.length === 1) {
      alert("Event added.");
    } else {
      alert(`${rows.length} repeated events added.`);
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm("Delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      alert(error.message || "Could not delete event.");
      return;
    }

    loadEvents();
  }

  async function addNotice() {
    if (!newNotice.title || !newNotice.content) {
      alert("Please enter a notice title and content.");
      return;
    }

    const { error } = await supabase.from("notices").insert([newNotice]);

    if (error) {
      alert(error.message || "Could not add notice.");
      return;
    }

    setNewNotice({ title: "", content: "" });
    loadNotices();
  }

  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;

    const { error } = await supabase.from("notices").delete().eq("id", id);

    if (error) {
      alert(error.message || "Could not delete notice.");
      return;
    }

    loadNotices();
  }

  async function addMember() {
    if (!newMember.full_name) {
      alert("Please enter a member name.");
      return;
    }

    const { error } = await supabase.from("members").insert([newMember]);

    if (error) {
      alert(error.message || "Could not add member.");
      return;
    }

    setNewMember({
      full_name: "",
      phone: "",
      email: "",
      category: "Gents",
    });

    loadMembers();
  }

  async function deleteMember(id) {
    if (!window.confirm("Delete this member?")) return;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      alert(error.message || "Could not delete member.");
      return;
    }

    loadMembers();
  }

  async function addOfficeBearer() {
    if (!newOfficeBearer.role || !newOfficeBearer.name) {
      alert("Please enter role and name.");
      return;
    }

    const nextOrder =
      officeBearers.length > 0
        ? Math.max(...officeBearers.map((x) => x.display_order || 0)) + 1
        : 1;

    const { error } = await supabase.from("office_bearers").insert([
      {
        ...newOfficeBearer,
        display_order: nextOrder,
      },
    ]);

    if (error) {
      alert(error.message || "Could not add office bearer.");
      return;
    }

    setNewOfficeBearer({
      role: "",
      name: "",
      phone: "",
      email: "",
    });

    loadOfficeBearers();
  }

  async function deleteOfficeBearer(id) {
    if (!window.confirm("Delete this office bearer?")) return;

    const { error } = await supabase
      .from("office_bearers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message || "Could not delete office bearer.");
      return;
    }

    loadOfficeBearers();
  }

  async function addCoach() {
    if (!newCoach.name) {
      alert("Please enter coach name.");
      return;
    }

    const { error } = await supabase.from("coaches").insert([newCoach]);

    if (error) {
      alert(error.message || "Could not add coach.");
      return;
    }

    setNewCoach({
      name: "",
      phone: "",
      email: "",
      notes: "",
    });

    loadCoaches();
  }

  async function deleteCoach(id) {
    if (!window.confirm("Delete this coach?")) return;

    const { error } = await supabase.from("coaches").delete().eq("id", id);

    if (error) {
      alert(error.message || "Could not delete coach.");
      return;
    }

    loadCoaches();
  }

  async function uploadDocument(file) {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message || "Document upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("documents").insert([
      {
        title: file.name,
        file_url: publicData?.publicUrl || "",
      },
    ]);

    if (insertError) {
      alert(insertError.message || "Upload saved but database record failed.");
      return;
    }

    loadDocuments();
  }

  async function deleteDocument(id) {
    if (!window.confirm("Delete this document?")) return;

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      alert(error.message || "Could not delete document.");
      return;
    }

    loadDocuments();
  }

  function renderHome() {
    return (
      <div style={styles.grid3}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome</h2>
          <p style={styles.largeText}>
            Welcome to the club app. Use the tabs above to view diary dates,
            notices, members, office bearers, coaches and documents.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upcoming Diary</h2>

          {nextUpcomingEvent ? (
            <div style={styles.eventCard}>
              <div style={styles.eventTitle}>
                {safeString(nextUpcomingEvent.title, "Untitled event")}
              </div>

              <div style={styles.eventDate}>
                {formatDate(nextUpcomingEvent.event_date)}
              </div>

              {nextUpcomingEvent.event_time ? (
                <div style={styles.eventMeta}>
                  Time: {nextUpcomingEvent.event_time}
                </div>
              ) : null}

              {nextUpcomingEvent.details ? (
                <div style={styles.eventDetails}>
                  {nextUpcomingEvent.details}
                </div>
              ) : null}
            </div>
          ) : (
            <p style={styles.emptyText}>No upcoming events.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Latest Notices</h2>

          {latestNotices.length === 0 ? (
            <p style={styles.emptyText}>No notices yet.</p>
          ) : (
            latestNotices.map((notice) => (
              <div key={notice.id} style={styles.noticeCard}>
                <div style={styles.noticeTitle}>{safeString(notice.title)}</div>
                <div style={styles.noticeBody}>{safeString(notice.content)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  function renderDiary() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Diary</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Event</h3>

            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />

              <input
                style={styles.input}
                type="date"
                value={newEvent.event_date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, event_date: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Time"
                value={newEvent.event_time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, event_time: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={newEvent.repeat_type}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, repeat_type: e.target.value })
                }
              >
                <option value="none">Do not repeat</option>
                <option value="weekly">Repeat weekly</option>
              </select>

              {newEvent.repeat_type === "weekly" ? (
                <input
                  style={styles.input}
                  type="date"
                  value={newEvent.repeat_until}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, repeat_until: e.target.value })
                  }
                />
              ) : null}
            </div>

            {newEvent.event_date ? (
              <div style={styles.repeatHelp}>
                First event day: <strong>{getDayNameFromDate(newEvent.event_date)}</strong>
                {newEvent.repeat_type === "weekly" && newEvent.repeat_until ? (
                  <>
                    {" "}— repeats every{" "}
                    <strong>{getDayNameFromDate(newEvent.event_date)}</strong> until{" "}
                    <strong>{formatDate(newEvent.repeat_until)}</strong>
                  </>
                ) : null}
              </div>
            ) : null}

            <textarea
              style={styles.textarea}
              placeholder="Details"
              value={newEvent.details}
              onChange={(e) =>
                setNewEvent({ ...newEvent, details: e.target.value })
              }
            />

            <button style={styles.primaryBtn} onClick={addEvent}>
              Add Event
            </button>
          </div>
        )}

        {events.length === 0 ? (
          <p style={styles.emptyText}>No diary events yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {events.map((event) => (
              <div key={event.id} style={styles.listCard}>
                <div style={styles.eventTitle}>{safeString(event.title)}</div>
                <div style={styles.eventDate}>{formatDate(event.event_date)}</div>

                {event.event_time ? (
                  <div style={styles.eventMeta}>Time: {event.event_time}</div>
                ) : null}

                {event.details ? (
                  <div style={styles.eventDetails}>{event.details}</div>
                ) : null}

                {adminMode ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteEvent(event.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderNotices() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Noticeboard</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Notice</h3>

            <input
              style={styles.input}
              placeholder="Notice title"
              value={newNotice.title}
              onChange={(e) =>
                setNewNotice({ ...newNotice, title: e.target.value })
              }
            />

            <textarea
              style={styles.textarea}
              placeholder="Notice content"
              value={newNotice.content}
              onChange={(e) =>
                setNewNotice({ ...newNotice, content: e.target.value })
              }
            />

            <button style={styles.primaryBtn} onClick={addNotice}>
              Add Notice
            </button>
          </div>
        )}

        {notices.length === 0 ? (
          <p style={styles.emptyText}>No notices yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {notices.map((notice) => (
              <div key={notice.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(notice.title)}</div>
                <div style={styles.noticeBody}>{safeString(notice.content)}</div>

                {adminMode ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteNotice(notice.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderMembersSection(title, items) {
    return (
      <div style={styles.memberSection}>
        <h3 style={styles.sectionTitle}>{title}</h3>

        {items.length === 0 ? (
          <p style={styles.emptyText}>None added yet.</p>
        ) : (
          items.map((member) => (
            <div key={member.id} style={styles.listCard}>
              <div style={styles.noticeTitle}>{safeString(member.full_name)}</div>

              {member.phone ? (
                <div style={styles.memberMeta}>Phone: {member.phone}</div>
              ) : null}

              {member.email ? (
                <div style={styles.memberMeta}>Email: {member.email}</div>
              ) : null}

              {adminMode ? (
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteMember(member.id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    );
  }

  function renderMembers() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Members</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Member</h3>

            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Full name"
                value={newMember.full_name}
                onChange={(e) =>
                  setNewMember({ ...newMember, full_name: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Phone"
                value={newMember.phone}
                onChange={(e) =>
                  setNewMember({ ...newMember, phone: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={newMember.category}
                onChange={(e) =>
                  setNewMember({ ...newMember, category: e.target.value })
                }
              >
                <option>Gents</option>
                <option>Ladies</option>
                <option>Associate</option>
              </select>
            </div>

            <button style={styles.primaryBtn} onClick={addMember}>
              Add Member
            </button>
          </div>
        )}

        <div style={styles.membersGrid}>
          {renderMembersSection("Gents", gentsMembers)}
          {renderMembersSection("Ladies", ladiesMembers)}
          {renderMembersSection("Associate", associateMembers)}
        </div>
      </div>
    );
  }

  function renderOfficeBearers() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Office Bearers</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Office Bearer</h3>

            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Role"
                value={newOfficeBearer.role}
                onChange={(e) =>
                  setNewOfficeBearer({
                    ...newOfficeBearer,
                    role: e.target.value,
                  })
                }
              />

              <input
                style={styles.input}
                placeholder="Name"
                value={newOfficeBearer.name}
                onChange={(e) =>
                  setNewOfficeBearer({
                    ...newOfficeBearer,
                    name: e.target.value,
                  })
                }
              />

              <input
                style={styles.input}
                placeholder="Phone"
                value={newOfficeBearer.phone}
                onChange={(e) =>
                  setNewOfficeBearer({
                    ...newOfficeBearer,
                    phone: e.target.value,
                  })
                }
              />

              <input
                style={styles.input}
                placeholder="Email"
                value={newOfficeBearer.email}
                onChange={(e) =>
                  setNewOfficeBearer({
                    ...newOfficeBearer,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <button style={styles.primaryBtn} onClick={addOfficeBearer}>
              Add Office Bearer
            </button>
          </div>
        )}

        {officeBearers.length === 0 ? (
          <p style={styles.emptyText}>No office bearers added yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {officeBearers.map((item) => (
              <div key={item.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(item.role)}</div>
                <div style={styles.memberMeta}>{safeString(item.name)}</div>

                {item.phone ? (
                  <div style={styles.memberMeta}>Phone: {item.phone}</div>
                ) : null}

                {item.email ? (
                  <div style={styles.memberMeta}>Email: {item.email}</div>
                ) : null}

                {adminMode ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteOfficeBearer(item.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderCoaches() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Club Coaches</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Coach</h3>

            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Name"
                value={newCoach.name}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, name: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Phone"
                value={newCoach.phone}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, phone: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Email"
                value={newCoach.email}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, email: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Notes"
                value={newCoach.notes}
                onChange={(e) =>
                  setNewCoach({ ...newCoach, notes: e.target.value })
                }
              />
            </div>

            <button style={styles.primaryBtn} onClick={addCoach}>
              Add Coach
            </button>
          </div>
        )}

        {coaches.length === 0 ? (
          <p style={styles.emptyText}>No coaches added yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {coaches.map((coach) => (
              <div key={coach.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(coach.name)}</div>

                {coach.phone ? (
                  <div style={styles.memberMeta}>Phone: {coach.phone}</div>
                ) : null}

                {coach.email ? (
                  <div style={styles.memberMeta}>Email: {coach.email}</div>
                ) : null}

                {coach.notes ? (
                  <div style={styles.memberMeta}>{coach.notes}</div>
                ) : null}

                {adminMode ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteCoach(coach.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDocuments() {
    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Documents</h2>

        {adminMode && (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Upload Document</h3>

            <input
              style={styles.input}
              type="file"
              onChange={(e) => uploadDocument(e.target.files?.[0])}
            />
          </div>
        )}

        {documents.length === 0 ? (
          <p style={styles.emptyText}>No documents yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.listCard}>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  {safeString(doc.title, "Open document")}
                </a>

                {adminMode ? (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteDocument(doc.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (loading) {
      return (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Loading...</h2>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return renderHome();
      case "diary":
        return renderDiary();
      case "notices":
        return renderNotices();
      case "members":
        return renderMembers();
      case "office":
        return renderOfficeBearers();
      case "coaches":
        return renderCoaches();
      case "documents":
        return renderDocuments();
      default:
        return renderHome();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.brandWrap}>
              <img src={logo} alt="Club Logo" style={styles.logo} />
              <div>
                <h1 style={styles.title}>{CLUB_NAME}</h1>
                <div style={styles.subtitle}>{CLUB_SUBTITLE}</div>
              </div>
            </div>

            <div style={styles.headerButtons}>
              {adminMode ? (
                <button style={styles.adminBtn} onClick={handleAdminLogout}>
                  Logout
                </button>
              ) : (
                <button
                  style={styles.adminBtn}
                  onClick={() => setShowAdminLogin(!showAdminLogin)}
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>

          <div style={styles.memberAccess}>
            {adminMode ? "Logged in as Admin" : "Open member access"}
          </div>

          {showAdminLogin && !adminMode ? (
            <div style={styles.loginRow}>
              <input
                style={styles.loginInput}
                type="password"
                placeholder="Enter admin PIN"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
              />
              <button style={styles.primaryBtn} onClick={handleAdminLogin}>
                Enter
              </button>
            </div>
          ) : null}
        </div>

        <div style={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div style={styles.errorBanner}>{errorMessage}</div>
        ) : null}

        {renderContent()}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #5b1224 0%, #7a1d32 55%, #611426 100%)",
    padding: 16,
    fontFamily: "Arial, sans-serif",
    color: "#23364f",
  },
  wrap: {
    maxWidth: 1900,
    margin: "0 auto",
  },
  header: {
    background: "#ececec",
    borderRadius: 34,
    padding: 30,
    marginBottom: 22,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  logo: {
    width: 180,
    height: 180,
    objectFit: "contain",
  },
  title: {
    margin: 0,
    fontSize: 78,
    lineHeight: 1.05,
    color: "#84233a",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 38,
    fontWeight: 700,
    color: "#2d3f59",
  },
  headerButtons: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  adminBtn: {
    background: "#626262",
    color: "#fff",
    border: "none",
    borderRadius: 18,
    padding: "20px 34px",
    fontSize: 28,
    fontWeight: 700,
    cursor: "pointer",
  },
  memberAccess: {
    marginTop: 26,
    fontSize: 28,
    fontWeight: 700,
    color: "#23364f",
  },
  loginRow: {
    marginTop: 20,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  loginInput: {
    padding: 14,
    borderRadius: 12,
    border: "1px solid #bbb",
    fontSize: 20,
    minWidth: 240,
  },
  tabBar: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 22,
  },
  tab: {
    background: "#f4e9ee",
    color: "#6f2134",
    border: "none",
    borderRadius: 18,
    padding: "18px 26px",
    fontSize: 28,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 2px 0 rgba(0,0,0,0.08)",
  },
  activeTab: {
    background: "#8b2940",
    color: "#fff",
  },
  errorBanner: {
    background: "#f7e8ec",
    color: "#b00020",
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    fontSize: 22,
    fontWeight: 800,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 26,
  },
  card: {
    background: "#ececec",
    borderRadius: 28,
    padding: 28,
    minHeight: 250,
  },
  cardTitle: {
    margin: "0 0 24px 0",
    fontSize: 54,
    lineHeight: 1.05,
    color: "#84233a",
    fontWeight: 800,
  },
  sectionTitle: {
    margin: "0 0 18px 0",
    fontSize: 34,
    color: "#84233a",
    fontWeight: 800,
  },
  largeText: {
    fontSize: 28,
    lineHeight: 1.6,
    fontWeight: 700,
    color: "#2d3f59",
  },
  eventCard: {
    background: "#f1eaed",
    borderRadius: 20,
    padding: 22,
    border: "1px solid #dcc7cf",
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#84233a",
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 22,
    fontWeight: 700,
    color: "#2d3f59",
    marginBottom: 8,
  },
  eventMeta: {
    fontSize: 20,
    fontWeight: 600,
    color: "#2d3f59",
    marginBottom: 6,
  },
  eventDetails: {
    fontSize: 19,
    lineHeight: 1.5,
    color: "#2d3f59",
    marginTop: 10,
    whiteSpace: "pre-wrap",
  },
  noticeCard: {
    background: "#f1eaed",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#84233a",
    marginBottom: 8,
  },
  noticeBody: {
    fontSize: 20,
    lineHeight: 1.5,
    color: "#2d3f59",
    whiteSpace: "pre-wrap",
  },
  emptyText: {
    fontSize: 22,
    color: "#2d3f59",
    fontWeight: 600,
  },
  adminBox: {
    background: "#f4e9ee",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  adminTitle: {
    marginTop: 0,
    fontSize: 28,
    color: "#84233a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #c7b7be",
    fontSize: 18,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #c7b7be",
    fontSize: 18,
    boxSizing: "border-box",
    marginBottom: 12,
  },
  repeatHelp: {
    fontSize: 18,
    color: "#2d3f59",
    fontWeight: 600,
    marginBottom: 12,
  },
  primaryBtn: {
    background: "#8b2940",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteBtn: {
    marginTop: 14,
    background: "#c70039",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  listWrap: {
    display: "grid",
    gap: 16,
  },
  listCard: {
    background: "#f7f3f5",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #e0d2d8",
  },
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  memberSection: {
    background: "#f7f3f5",
    borderRadius: 20,
    padding: 18,
  },
  memberMeta: {
    fontSize: 19,
    color: "#2d3f59",
    marginBottom: 6,
    fontWeight: 600,
  },
  link: {
    fontSize: 22,
    fontWeight: 700,
    color: "#84233a",
    textDecoration: "none",
  },
};
