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

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    if (obj && obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      return obj[key];
    }
  }
  return fallback;
}

function cleanPhone(value) {
  const raw = safeString(value).trim();
  if (!raw) return "";
  return raw.replace(/[^\d+]/g, "");
}

function toWhatsAppLink(value) {
  const raw = safeString(value).trim();
  if (!raw) return "";
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = `44${cleaned.slice(1)}`;
  return cleaned ? `https://wa.me/${cleaned}` : "";
}

function shouldShowTime(timeValue) {
  const t = safeString(timeValue).trim().toLowerCase();
  return t && t !== "00:00" && t !== "00:00:00" && t !== "midnight";
}

function normaliseEvent(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "name", "event_name"], "Untitled event"),
    event_date: getFirstValue(row, ["event_date", "date", "eventDate"]),
    event_time: getFirstValue(row, ["event_time", "time", "eventTime"]),
    details: getFirstValue(row, ["details", "content", "description", "notes"]),
  };
}

function normaliseNotice(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "heading", "name"], "Notice"),
    content: getFirstValue(row, ["content", "details", "description", "text"]),
    created_at: getFirstValue(row, ["created_at"]),
  };
}

function normaliseMember(row) {
  return {
    id: getFirstValue(row, ["id"]),
    full_name: getFirstValue(row, ["full_name", "name", "member_name"]),
    phone: getFirstValue(row, ["phone", "mobile", "telephone", "tel"]),
    whatsapp: getFirstValue(row, ["whatsapp", "whats_app", "whatsapp_number"]),
    email: getFirstValue(row, ["email", "email_address"]),
    category: getFirstValue(row, ["category", "section", "member_type"], "Gents"),
  };
}

function normaliseOfficeBearer(row) {
  return {
    id: getFirstValue(row, ["id"]),
    role: getFirstValue(row, ["role", "position", "title"]),
    name: getFirstValue(row, ["name", "full_name", "person"]),
    phone: getFirstValue(row, ["phone", "mobile", "telephone", "tel"]),
    whatsapp: getFirstValue(row, ["whatsapp", "whats_app", "whatsapp_number"]),
    email: getFirstValue(row, ["email", "email_address"]),
    display_order: Number(getFirstValue(row, ["display_order", "sort_order", "position_order"], 0)),
  };
}

function normaliseCoach(row) {
  return {
    id: getFirstValue(row, ["id"]),
    name: getFirstValue(row, ["name", "full_name"]),
    phone: getFirstValue(row, ["phone", "mobile", "telephone", "tel"]),
    whatsapp: getFirstValue(row, ["whatsapp", "whats_app", "whatsapp_number"]),
    email: getFirstValue(row, ["email", "email_address"]),
    notes: getFirstValue(row, ["notes", "details", "description"]),
  };
}

function normaliseDocument(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "name", "file_name"], "Open document"),
    file_url: getFirstValue(row, ["file_url", "url", "link"]),
  };
}

async function tryLoadTable(tableNames, normaliser, orderConfigs = []) {
  for (const tableName of tableNames) {
    let query = supabase.from(tableName).select("*");

    for (const item of orderConfigs) {
      query = query.order(item.column, { ascending: item.ascending });
    }

    const { data, error } = await query;

    if (!error) {
      return {
        ok: true,
        tableName,
        rows: (data || []).map(normaliser),
      };
    }
  }

  return {
    ok: false,
    tableName: null,
    rows: [],
  };
}

function ContactButtons({ item }) {
  const phone = cleanPhone(item.phone);
  const whatsappLink = toWhatsAppLink(item.whatsapp || item.phone);
  const email = safeString(item.email);

  if (!phone && !whatsappLink && !email) return null;

  return (
    <div style={styles.contactButtons}>
      {phone ? (
        <a href={`tel:${phone}`} style={styles.actionBtn}>
          Call
        </a>
      ) : null}
      {whatsappLink ? (
        <a href={whatsappLink} target="_blank" rel="noreferrer" style={styles.actionBtnAlt}>
          WhatsApp
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} style={styles.actionBtnAlt}>
          Email
        </a>
      ) : null}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [eventsTableName, setEventsTableName] = useState("events");
  const [noticesTableName, setNoticesTableName] = useState("notices");
  const [membersTableName, setMembersTableName] = useState("members");
  const [officeTableName, setOfficeTableName] = useState("office_bearers");
  const [coachesTableName, setCoachesTableName] = useState("coaches");
  const [documentsTableName, setDocumentsTableName] = useState("documents");

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
    whatsapp: "",
    email: "",
    category: "Gents",
  });

  const [newOfficeBearer, setNewOfficeBearer] = useState({
    role: "",
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
  });

  const [newCoach, setNewCoach] = useState({
    name: "",
    phone: "",
    whatsapp: "",
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
    const result = await tryLoadTable(
      ["events", "diary_events"],
      normaliseEvent,
      [
        { column: "event_date", ascending: true },
        { column: "event_time", ascending: true },
      ]
    );

    if (!result.ok) {
      setEvents([]);
      setErrorMessage("Could not load events.");
      return;
    }

    setEventsTableName(result.tableName);
    setEvents(result.rows);
  }

  async function loadNotices() {
    const result = await tryLoadTable(
      ["notices", "information_posts"],
      normaliseNotice,
      [{ column: "created_at", ascending: false }]
    );

    if (result.ok) {
      setNoticesTableName(result.tableName);
      setNotices(result.rows);
    } else {
      setNotices([]);
    }
  }

  async function loadMembers() {
    const result = await tryLoadTable(
      ["members"],
      normaliseMember,
      [{ column: "full_name", ascending: true }]
    );

    if (result.ok) {
      setMembersTableName(result.tableName);
      setMembers(result.rows);
    } else {
      setMembers([]);
    }
  }

  async function loadOfficeBearers() {
    const result = await tryLoadTable(
      ["office_bearers"],
      normaliseOfficeBearer,
      [{ column: "display_order", ascending: true }]
    );

    if (result.ok) {
      setOfficeTableName(result.tableName);
      setOfficeBearers(
        [...result.rows].sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
      );
    } else {
      setOfficeBearers([]);
    }
  }

  async function loadCoaches() {
    const result = await tryLoadTable(
      ["coaches", "club_coaches"],
      normaliseCoach,
      [{ column: "name", ascending: true }]
    );

    if (result.ok) {
      setCoachesTableName(result.tableName);
      setCoaches(result.rows);
    } else {
      setCoaches([]);
    }
  }

  async function loadDocuments() {
    const result = await tryLoadTable(
      ["documents"],
      normaliseDocument,
      [{ column: "created_at", ascending: false }]
    );

    if (result.ok) {
      setDocumentsTableName(result.tableName);
      setDocuments(result.rows);
    } else {
      setDocuments([]);
    }
  }

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const futureEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        if (!event.event_date) return false;
        const d = new Date(event.event_date);
        return !Number.isNaN(d.getTime()) && d >= todayStart;
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.event_date}T${a.event_time || "00:00"}`);
        const bDate = new Date(`${b.event_date}T${b.event_time || "00:00"}`);
        return aDate - bDate;
      });
  }, [events, todayStart]);

  const pastEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        if (!event.event_date) return false;
        const d = new Date(event.event_date);
        return !Number.isNaN(d.getTime()) && d < todayStart;
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.event_date}T${a.event_time || "00:00"}`);
        const bDate = new Date(`${b.event_date}T${b.event_time || "00:00"}`);
        return aDate - bDate;
      });
  }, [events, todayStart]);

  const nextUpcomingEvent = futureEvents.length > 0 ? futureEvents[0] : null;
  const latestNotices = notices.slice(0, 5);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      const haystack = [
        safeString(m.full_name),
        safeString(m.phone),
        safeString(m.whatsapp),
        safeString(m.email),
        safeString(m.category),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [members, memberSearch]);

  const gentsMembers = filteredMembers.filter(
    (m) => safeString(m.category).toLowerCase() === "gents"
  );
  const ladiesMembers = filteredMembers.filter(
    (m) => safeString(m.category).toLowerCase() === "ladies"
  );
  const associateMembers = filteredMembers.filter(
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

    const { error } = await supabase.from(eventsTableName).insert(rows);

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
    alert(rows.length === 1 ? "Event added." : `${rows.length} repeated events added.`);
  }

  async function deleteEvent(id) {
    if (!window.confirm("Delete this event?")) return;

    const { error } = await supabase.from(eventsTableName).delete().eq("id", id);
    if (error) {
      alert(error.message || "Could not delete event.");
      return;
    }

    loadEvents();
  }

  async function deletePastEvents() {
    if (pastEvents.length === 0) {
      alert("There are no past events to delete.");
      return;
    }

    if (!window.confirm(`Delete ${pastEvents.length} past event(s)?`)) return;

    const pastIds = pastEvents.map((e) => e.id).filter(Boolean);

    const { error } = await supabase.from(eventsTableName).delete().in("id", pastIds);
    if (error) {
      alert(error.message || "Could not delete past events.");
      return;
    }

    loadEvents();
  }

  async function addNotice() {
    if (!newNotice.title || !newNotice.content) {
      alert("Please enter a notice title and content.");
      return;
    }

    const { error } = await supabase.from(noticesTableName).insert([
      {
        title: newNotice.title,
        content: newNotice.content,
      },
    ]);

    if (error) {
      alert(error.message || "Could not add notice.");
      return;
    }

    setNewNotice({ title: "", content: "" });
    loadNotices();
  }

  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;

    const { error } = await supabase.from(noticesTableName).delete().eq("id", id);
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

    const { error } = await supabase.from(membersTableName).insert([
      {
        full_name: newMember.full_name,
        phone: newMember.phone || null,
        whatsapp: newMember.whatsapp || null,
        email: newMember.email || null,
        category: newMember.category || "Gents",
      },
    ]);

    if (error) {
      alert(error.message || "Could not add member.");
      return;
    }

    setNewMember({
      full_name: "",
      phone: "",
      whatsapp: "",
      email: "",
      category: "Gents",
    });

    loadMembers();
  }

  async function deleteMember(id) {
    if (!window.confirm("Delete this member?")) return;

    const { error } = await supabase.from(membersTableName).delete().eq("id", id);
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
        ? Math.max(...officeBearers.map((x) => Number(x.display_order || 0))) + 1
        : 1;

    const { error } = await supabase.from(officeTableName).insert([
      {
        role: newOfficeBearer.role,
        name: newOfficeBearer.name,
        phone: newOfficeBearer.phone || null,
        whatsapp: newOfficeBearer.whatsapp || null,
        email: newOfficeBearer.email || null,
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
      whatsapp: "",
      email: "",
    });

    loadOfficeBearers();
  }

  async function deleteOfficeBearer(id) {
    if (!window.confirm("Delete this office bearer?")) return;

    const { error } = await supabase.from(officeTableName).delete().eq("id", id);
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

    const { error } = await supabase.from(coachesTableName).insert([
      {
        name: newCoach.name,
        phone: newCoach.phone || null,
        whatsapp: newCoach.whatsapp || null,
        email: newCoach.email || null,
        notes: newCoach.notes || null,
      },
    ]);

    if (error) {
      alert(error.message || "Could not add coach.");
      return;
    }

    setNewCoach({
      name: "",
      phone: "",
      whatsapp: "",
      email: "",
      notes: "",
    });

    loadCoaches();
  }

  async function deleteCoach(id) {
    if (!window.confirm("Delete this coach?")) return;

    const { error } = await supabase.from(coachesTableName).delete().eq("id", id);
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

    const { error: insertError } = await supabase.from(documentsTableName).insert([
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

    const { error } = await supabase.from(documentsTableName).delete().eq("id", id);
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

          <div style={styles.websiteRow}>
            <a
              href="https://woodileebowlingclub.co.uk/home"
              target="_blank"
              rel="noreferrer"
              style={styles.websiteLink}
            >
              Visit our website
            </a>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upcoming Diary</h2>
          {nextUpcomingEvent ? (
            <div style={styles.eventCard}>
              <div style={styles.eventTitle}>{safeString(nextUpcomingEvent.title)}</div>
              <div style={styles.eventDate}>{formatDate(nextUpcomingEvent.event_date)}</div>
              {shouldShowTime(nextUpcomingEvent.event_time) ? (
                <div style={styles.eventMeta}>Time: {nextUpcomingEvent.event_time}</div>
              ) : null}
              {nextUpcomingEvent.details ? (
                <div style={styles.eventDetails}>{nextUpcomingEvent.details}</div>
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

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Event</h3>

            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <input
                style={styles.input}
                type="date"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Time"
                value={newEvent.event_time}
                onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
              />
              <select
                style={styles.input}
                value={newEvent.repeat_type}
                onChange={(e) => setNewEvent({ ...newEvent, repeat_type: e.target.value })}
              >
                <option value="none">Do not repeat</option>
                <option value="weekly">Repeat weekly</option>
              </select>
              {newEvent.repeat_type === "weekly" ? (
                <input
                  style={styles.input}
                  type="date"
                  value={newEvent.repeat_until}
                  onChange={(e) => setNewEvent({ ...newEvent, repeat_until: e.target.value })}
                />
              ) : null}
            </div>

            {newEvent.event_date ? (
              <div style={styles.repeatHelp}>
                First event day: <strong>{getDayNameFromDate(newEvent.event_date)}</strong>
                {newEvent.repeat_type === "weekly" && newEvent.repeat_until ? (
                  <>
                    {" "}— repeats every <strong>{getDayNameFromDate(newEvent.event_date)}</strong> until{" "}
                    <strong>{formatDate(newEvent.repeat_until)}</strong>
                  </>
                ) : null}
              </div>
            ) : null}

            <textarea
              style={styles.textarea}
              placeholder="Details"
              value={newEvent.details}
              onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })}
            />

            <div style={styles.adminActionRow}>
              <button style={styles.primaryBtn} onClick={addEvent}>
                Add Event
              </button>

              <button style={styles.secondaryBtn} onClick={deletePastEvents}>
                Delete Past Events
              </button>
            </div>
          </div>
        ) : null}

        {futureEvents.length === 0 ? (
          <p style={styles.emptyText}>No diary events yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {futureEvents.map((event) => (
              <div key={event.id} style={styles.listCard}>
                <div style={styles.eventTitle}>{safeString(event.title)}</div>
                <div style={styles.eventDate}>{formatDate(event.event_date)}</div>
                {shouldShowTime(event.event_time) ? (
                  <div style={styles.eventMeta}>Time: {event.event_time}</div>
                ) : null}
                {event.details ? (
                  <div style={styles.eventDetails}>{event.details}</div>
                ) : null}
                {adminMode ? (
                  <button style={styles.deleteBtn} onClick={() => deleteEvent(event.id)}>
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

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Notice</h3>
            <input
              style={styles.input}
              placeholder="Notice title"
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            />
            <textarea
              style={styles.textarea}
              placeholder="Notice content"
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
            />
            <button style={styles.primaryBtn} onClick={addNotice}>
              Add Notice
            </button>
          </div>
        ) : null}

        {notices.length === 0 ? (
          <p style={styles.emptyText}>No notices yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {notices.map((notice) => (
              <div key={notice.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(notice.title)}</div>
                <div style={styles.noticeBody}>{safeString(notice.content)}</div>
                {adminMode ? (
                  <button style={styles.deleteBtn} onClick={() => deleteNotice(notice.id)}>
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
              {member.phone ? <div style={styles.infoLine}>Phone: {member.phone}</div> : null}
              {member.whatsapp ? <div style={styles.infoLine}>WhatsApp: {member.whatsapp}</div> : null}
              {member.email ? <div style={styles.infoLine}>Email: {member.email}</div> : null}
              <ContactButtons item={member} />
              {adminMode ? (
                <button style={styles.deleteBtn} onClick={() => deleteMember(member.id)}>
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

        <div style={styles.searchRow}>
          <input
            style={styles.input}
            placeholder="Search members"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Member</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Full name"
                value={newMember.full_name}
                onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="WhatsApp"
                value={newMember.whatsapp}
                onChange={(e) => setNewMember({ ...newMember, whatsapp: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
              <select
                style={styles.input}
                value={newMember.category}
                onChange={(e) => setNewMember({ ...newMember, category: e.target.value })}
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
        ) : null}

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

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Office Bearer</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Role"
                value={newOfficeBearer.role}
                onChange={(e) => setNewOfficeBearer({ ...newOfficeBearer, role: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Name"
                value={newOfficeBearer.name}
                onChange={(e) => setNewOfficeBearer({ ...newOfficeBearer, name: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={newOfficeBearer.phone}
                onChange={(e) => setNewOfficeBearer({ ...newOfficeBearer, phone: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="WhatsApp"
                value={newOfficeBearer.whatsapp}
                onChange={(e) => setNewOfficeBearer({ ...newOfficeBearer, whatsapp: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={newOfficeBearer.email}
                onChange={(e) => setNewOfficeBearer({ ...newOfficeBearer, email: e.target.value })}
              />
            </div>
            <button style={styles.primaryBtn} onClick={addOfficeBearer}>
              Add Office Bearer
            </button>
          </div>
        ) : null}

        {officeBearers.length === 0 ? (
          <p style={styles.emptyText}>No office bearers added yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {officeBearers.map((item) => (
              <div key={item.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(item.role)}</div>
                <div style={styles.infoLineStrong}>{safeString(item.name)}</div>
                {item.phone ? <div style={styles.infoLine}>Phone: {item.phone}</div> : null}
                {item.whatsapp ? <div style={styles.infoLine}>WhatsApp: {item.whatsapp}</div> : null}
                {item.email ? <div style={styles.infoLine}>Email: {item.email}</div> : null}
                <ContactButtons item={item} />
                {adminMode ? (
                  <button style={styles.deleteBtn} onClick={() => deleteOfficeBearer(item.id)}>
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

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Add Coach</h3>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Name"
                value={newCoach.name}
                onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={newCoach.phone}
                onChange={(e) => setNewCoach({ ...newCoach, phone: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="WhatsApp"
                value={newCoach.whatsapp}
                onChange={(e) => setNewCoach({ ...newCoach, whatsapp: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={newCoach.email}
                onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Notes"
                value={newCoach.notes}
                onChange={(e) => setNewCoach({ ...newCoach, notes: e.target.value })}
              />
            </div>
            <button style={styles.primaryBtn} onClick={addCoach}>
              Add Coach
            </button>
          </div>
        ) : null}

        {coaches.length === 0 ? (
          <p style={styles.emptyText}>No coaches added yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {coaches.map((coach) => (
              <div key={coach.id} style={styles.listCard}>
                <div style={styles.noticeTitle}>{safeString(coach.name)}</div>
                {coach.phone ? <div style={styles.infoLine}>Phone: {coach.phone}</div> : null}
                {coach.whatsapp ? <div style={styles.infoLine}>WhatsApp: {coach.whatsapp}</div> : null}
                {coach.email ? <div style={styles.infoLine}>Email: {coach.email}</div> : null}
                {coach.notes ? <div style={styles.infoLine}>{coach.notes}</div> : null}
                <ContactButtons item={coach} />
                {adminMode ? (
                  <button style={styles.deleteBtn} onClick={() => deleteCoach(coach.id)}>
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

        {adminMode ? (
          <div style={styles.adminBox}>
            <h3 style={styles.adminTitle}>Upload Document</h3>
            <input
              style={styles.input}
              type="file"
              onChange={(e) => uploadDocument(e.target.files?.[0])}
            />
          </div>
        ) : null}

        {documents.length === 0 ? (
          <p style={styles.emptyText}>No documents yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.listCard}>
                <a href={doc.file_url} target="_blank" rel="noreferrer" style={styles.link}>
                  {safeString(doc.title, "Open document")}
                </a>
                {adminMode ? (
                  <button style={styles.deleteBtn} onClick={() => deleteDocument(doc.id)}>
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
              {logo ? <img src={logo} alt="Club Logo" style={styles.logo} /> : null}
              <div style={styles.titleBlock}>
                <h1 style={styles.title}>{CLUB_NAME}</h1>
                <div style={styles.subtitle}>{CLUB_SUBTITLE}</div>
              </div>
            </div>
          </div>

          {!adminMode ? (
            <div style={styles.adminStripWrap}>
              {!showAdminLogin ? (
                <button style={styles.smallAdminToggle} onClick={() => setShowAdminLogin(true)}>
                  Admin
                </button>
              ) : (
                <div style={styles.compactAdminPanel}>
                  <input
                    style={styles.compactPinInput}
                    type="password"
                    placeholder="Admin PIN"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                  />
                  <button style={styles.compactAdminBtn} onClick={handleAdminLogin}>
                    Go
                  </button>
                  <button
                    style={styles.compactCancelBtn}
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPinInput("");
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.loggedInRow}>
              <div style={styles.loggedInText}>Logged in as Admin</div>
              <button style={styles.smallLogoutBtn} onClick={handleAdminLogout}>
                Logout
              </button>
            </div>
          )}
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

        {errorMessage ? <div style={styles.errorBanner}>{errorMessage}</div> : null}

        {renderContent()}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #5b1224 0%, #7a1d32 55%, #611426 100%)",
    padding: 14,
    fontFamily: "Arial, sans-serif",
    color: "#23364f",
  },
  wrap: {
    maxWidth: 1480,
    margin: "0 auto",
  },
  header: {
    background: "#ececec",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.08,
    color: "#84233a",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 700,
    color: "#2d3f59",
  },
  adminStripWrap: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-start",
  },
  smallAdminToggle: {
    background: "transparent",
    color: "#666",
    border: "1px solid #c8c8c8",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  compactAdminPanel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  compactPinInput: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #c7b7be",
    fontSize: 14,
    minWidth: 140,
    background: "#fff",
  },
  compactAdminBtn: {
    background: "#8b2940",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  compactCancelBtn: {
    background: "#ddd",
    color: "#444",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  loggedInRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  loggedInText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#23364f",
  },
  smallLogoutBtn: {
    background: "#666",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  tabBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  tab: {
    background: "#f4e9ee",
    color: "#6f2134",
    border: "none",
    borderRadius: 16,
    padding: "12px 18px",
    fontSize: 17,
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    fontWeight: 800,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#ececec",
    borderRadius: 20,
    padding: 18,
    minHeight: 220,
  },
  cardTitle: {
    margin: "0 0 16px 0",
    fontSize: 28,
    lineHeight: 1.1,
    color: "#84233a",
    fontWeight: 800,
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: 21,
    color: "#84233a",
    fontWeight: 800,
  },
  largeText: {
    fontSize: 17,
    lineHeight: 1.5,
    fontWeight: 700,
    color: "#2d3f59",
  },
  websiteRow: {
    marginTop: 14,
  },
  websiteLink: {
    display: "inline-block",
    background: "#8b2940",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 15,
    fontWeight: 700,
  },
  eventCard: {
    background: "#f7f3f5",
    borderRadius: 15,
    padding: 15,
    border: "1px solid #e0d2d8",
  },
  eventTitle: {
    fontSize: 21,
    fontWeight: 800,
    color: "#84233a",
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2d3f59",
    marginBottom: 6,
  },
  eventMeta: {
    fontSize: 15,
    fontWeight: 600,
    color: "#2d3f59",
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 15,
    lineHeight: 1.45,
    color: "#2d3f59",
    marginTop: 8,
    whiteSpace: "pre-wrap",
  },
  noticeCard: {
    background: "#f7f3f5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    border: "1px solid #e0d2d8",
  },
  noticeTitle: {
    fontSize: 19,
    fontWeight: 800,
    color: "#84233a",
    marginBottom: 8,
  },
  noticeBody: {
    fontSize: 15,
    lineHeight: 1.45,
    color: "#2d3f59",
    whiteSpace: "pre-wrap",
  },
  emptyText: {
    fontSize: 16,
    color: "#2d3f59",
    fontWeight: 600,
  },
  adminBox: {
    background: "#f4e9ee",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  adminTitle: {
    marginTop: 0,
    fontSize: 21,
    color: "#84233a",
  },
  adminActionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #c7b7be",
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #c7b7be",
    fontSize: 15,
    boxSizing: "border-box",
    marginBottom: 12,
    background: "#fff",
  },
  repeatHelp: {
    fontSize: 14,
    color: "#2d3f59",
    fontWeight: 600,
    marginBottom: 12,
  },
  primaryBtn: {
    background: "#8b2940",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#666",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteBtn: {
    marginTop: 12,
    background: "#c70039",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  listWrap: {
    display: "grid",
    gap: 12,
  },
  listCard: {
    background: "#f7f3f5",
    borderRadius: 14,
    padding: 14,
    border: "1px solid #e0d2d8",
  },
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  memberSection: {
    background: "#f7f3f5",
    borderRadius: 16,
    padding: 14,
    border: "1px solid #e0d2d8",
  },
  infoLine: {
    fontSize: 15,
    color: "#2d3f59",
    marginBottom: 5,
    fontWeight: 600,
    wordBreak: "break-word",
  },
  infoLineStrong: {
    fontSize: 16,
    color: "#2d3f59",
    marginBottom: 6,
    fontWeight: 800,
    wordBreak: "break-word",
  },
  searchRow: {
    marginBottom: 14,
  },
  contactButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  actionBtn: {
    display: "inline-block",
    background: "#8b2940",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  actionBtnAlt: {
    display: "inline-block",
    background: "#e9dde2",
    color: "#6f2134",
    textDecoration: "none",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  link: {
    fontSize: 18,
    fontWeight: 700,
    color: "#84233a",
    textDecoration: "none",
    wordBreak: "break-word",
  },
};
