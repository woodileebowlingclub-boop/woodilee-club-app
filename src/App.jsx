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

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    if (obj && obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      return obj[key];
    }
  }
  return fallback;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return safeString(dateStr);
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
  return !!t && t !== "00:00" && t !== "00:00:00" && t !== "midnight";
}

function normaliseMemberCategory(value) {
  const v = safeString(value).trim().toLowerCase();
  if (["gent", "gents", "men", "male"].includes(v)) return "gents";
  if (["lady", "ladies", "women", "female"].includes(v)) return "ladies";
  if (["associate", "associates", "assoc"].includes(v)) return "associate";
  return "gents";
}

function normaliseEvent(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "name", "event_name"], "Untitled event"),
    event_date: getFirstValue(row, ["event_date", "date", "eventDate"]),
    event_time: getFirstValue(row, ["event_time", "time", "time_text"]),
    details: getFirstValue(row, ["details", "note", "notes", "content", "description"]),
    date_text: getFirstValue(row, ["date_text"]),
  };
}

function normaliseNotice(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "heading", "name"], "Notice"),
    content: getFirstValue(row, ["message", "content", "details", "description", "text"]),
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
    category: normaliseMemberCategory(
      getFirstValue(row, ["category", "section", "member_type"], "gents")
    ),
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
    display_order: Number(
      getFirstValue(row, ["display_order", "sort_order", "position_order"], 0)
    ),
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
    category: "gents",
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

  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState({
    title: "",
    event_date: "",
    event_time: "",
    details: "",
  });

  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editingNotice, setEditingNotice] = useState({
    title: "",
    content: "",
  });

  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMember, setEditingMember] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    category: "gents",
  });

  const [editingOfficeBearerId, setEditingOfficeBearerId] = useState(null);
  const [editingOfficeBearer, setEditingOfficeBearer] = useState({
    role: "",
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
  });

  const [editingCoachId, setEditingCoachId] = useState(null);
  const [editingCoach, setEditingCoach] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    notes: "",
  });

  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [editingDocument, setEditingDocument] = useState({
    title: "",
    file_url: "",
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
      .order("event_date", { ascending: true });

    if (error) {
      setEvents([]);
      setErrorMessage(error.message || "Could not load events.");
      return;
    }

    setEvents((data || []).map(normaliseEvent));
  }

  async function loadNotices() {
    const { data, error } = await supabase
      .from("information_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setNotices((data || []).map(normaliseNotice));
    }
  }

  async function loadMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error) setMembers((data || []).map(normaliseMember));
  }

  async function loadOfficeBearers() {
    const { data, error } = await supabase
      .from("office_bearers")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error) {
      setOfficeBearers(
        (data || [])
          .map(normaliseOfficeBearer)
          .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
      );
    }
  }

  async function loadCoaches() {
    const { data, error } = await supabase
      .from("club_coaches")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setCoaches((data || []).map(normaliseCoach));
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setDocuments((data || []).map(normaliseDocument));
  }

  const allSortedEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        if (!event.event_date) return false;
        const d = new Date(event.event_date);
        return !Number.isNaN(d.getTime());
      })
      .sort((a, b) => {
        const aDate = new Date(`${a.event_date}T${a.event_time || "00:00"}`);
        const bDate = new Date(`${b.event_date}T${b.event_time || "00:00"}`);
        return aDate - bDate;
      });
  }, [events]);

  const diaryEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = allSortedEvents.filter((event) => {
      const d = new Date(event.event_date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    });

    if (upcoming.length > 0) return upcoming;
    return allSortedEvents.slice(-10).reverse();
  }, [allSortedEvents]);

  const pastEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allSortedEvents.filter((event) => {
      const d = new Date(event.event_date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    });
  }, [allSortedEvents]);

  const nextUpcomingEvent = diaryEvents.length > 0 ? diaryEvents[0] : null;
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

  const gentsMembers = filteredMembers.filter((m) => m.category === "gents");
  const ladiesMembers = filteredMembers.filter((m) => m.category === "ladies");
  const associateMembers = filteredMembers.filter((m) => m.category === "associate");

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
    if (!newEvent.title.trim() || !newEvent.event_date) {
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

    const rows = eventDates.map((dateStr) => {
      const prettyDate = formatDate(dateStr);
      return {
        title: newEvent.title.trim(),
        event_date: dateStr,
        date: dateStr,
        date_text: prettyDate,
        event_time: newEvent.event_time.trim() || null,
        time_text: newEvent.event_time.trim() || null,
        details: newEvent.details.trim() || null,
        note: newEvent.details.trim() || null,
      };
    });

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
    alert(rows.length === 1 ? "Event added." : `${rows.length} repeated events added.`);
  }

  function startEditEvent(event) {
    setEditingEventId(event.id);
    setEditingEvent({
      title: safeString(event.title),
      event_date: safeString(event.event_date),
      event_time: safeString(event.event_time),
      details: safeString(event.details),
    });
  }

  function cancelEditEvent() {
    setEditingEventId(null);
    setEditingEvent({
      title: "",
      event_date: "",
      event_time: "",
      details: "",
    });
  }

  async function saveEditEvent(id) {
    if (!editingEvent.title.trim() || !editingEvent.event_date) {
      alert("Please add at least a title and date.");
      return;
    }

    const prettyDate = formatDate(editingEvent.event_date);

    const payload = {
      title: editingEvent.title.trim(),
      event_date: editingEvent.event_date,
      date: editingEvent.event_date,
      date_text: prettyDate,
      event_time: editingEvent.event_time.trim() || null,
      time_text: editingEvent.event_time.trim() || null,
      details: editingEvent.details.trim() || null,
      note: editingEvent.details.trim() || null,
    };

    const { error } = await supabase.from("events").update(payload).eq("id", id);

    if (error) {
      alert(error.message || "Could not update event.");
      return;
    }

    cancelEditEvent();
    loadEvents();
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

  async function deletePastEvents() {
    if (pastEvents.length === 0) {
      alert("There are no past events to delete.");
      return;
    }

    if (!window.confirm(`Delete ${pastEvents.length} past event(s)?`)) return;

    const ids = pastEvents.map((e) => e.id).filter(Boolean);
    const { error } = await supabase.from("events").delete().in("id", ids);

    if (error) {
      alert(error.message || "Could not delete past events.");
      return;
    }

    loadEvents();
  }

  async function addNotice() {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert("Please enter a notice title and content.");
      return;
    }

    const bodyText = newNotice.content.trim();

    const { error } = await supabase.from("information_posts").insert([
      {
        title: newNotice.title.trim(),
        message: bodyText,
      },
    ]);

    if (error) {
      alert(error.message || "Could not add notice.");
      return;
    }

    setNewNotice({ title: "", content: "" });
    loadNotices();
  }

  function startEditNotice(notice) {
    setEditingNoticeId(notice.id);
    setEditingNotice({
      title: safeString(notice.title),
      content: safeString(notice.content),
    });
  }

  function cancelEditNotice() {
    setEditingNoticeId(null);
    setEditingNotice({ title: "", content: "" });
  }

  async function saveEditNotice(id) {
    if (!editingNotice.title.trim() || !editingNotice.content.trim()) {
      alert("Please enter a notice title and content.");
      return;
    }

    const bodyText = editingNotice.content.trim();

    const { error } = await supabase
      .from("information_posts")
      .update({
        title: editingNotice.title.trim(),
        message: bodyText,
      })
      .eq("id", id);

    if (error) {
      alert(error.message || "Could not update notice.");
      return;
    }

    cancelEditNotice();
    loadNotices();
  }

  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;

    const { error } = await supabase.from("information_posts").delete().eq("id", id);
    if (error) {
      alert(error.message || "Could not delete notice.");
      return;
    }

    loadNotices();
  }

  async function addMember() {
    if (!newMember.full_name.trim()) {
      alert("Please enter a member name.");
      return;
    }

    const payload = {
      full_name: newMember.full_name.trim(),
      name: newMember.full_name.trim(),
      phone: newMember.phone.trim() || null,
      whatsapp: newMember.whatsapp.trim() || null,
      email: newMember.email.trim() || null,
      category: normaliseMemberCategory(newMember.category),
    };

    const { error } = await supabase.from("members").insert([payload]);

    if (error) {
      alert(error.message || "Could not add member.");
      return;
    }

    setNewMember({
      full_name: "",
      phone: "",
      whatsapp: "",
      email: "",
      category: "gents",
    });

    await loadMembers();
    alert("Member added.");
  }

  function startEditMember(member) {
    setEditingMemberId(member.id);
    setEditingMember({
      full_name: safeString(member.full_name),
      phone: safeString(member.phone),
      whatsapp: safeString(member.whatsapp),
      email: safeString(member.email),
      category: normaliseMemberCategory(member.category),
    });
  }

  function cancelEditMember() {
    setEditingMemberId(null);
    setEditingMember({
      full_name: "",
      phone: "",
      whatsapp: "",
      email: "",
      category: "gents",
    });
  }

  async function saveEditMember(id) {
    if (!editingMember.full_name.trim()) {
      alert("Please enter a member name.");
      return;
    }

    const payload = {
      full_name: editingMember.full_name.trim(),
      name: editingMember.full_name.trim(),
      phone: editingMember.phone.trim() || null,
      whatsapp: editingMember.whatsapp.trim() || null,
      email: editingMember.email.trim() || null,
      category: normaliseMemberCategory(editingMember.category),
    };

    const { error } = await supabase.from("members").update(payload).eq("id", id);

    if (error) {
      alert(error.message || "Could not update member.");
      return;
    }

    cancelEditMember();
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
    if (!newOfficeBearer.role.trim() || !newOfficeBearer.name.trim()) {
      alert("Please enter role and name.");
      return;
    }

    const nextOrder =
      officeBearers.length > 0
        ? Math.max(...officeBearers.map((x) => Number(x.display_order || 0))) + 1
        : 1;

    const payload = {
      role: newOfficeBearer.role.trim(),
      name: newOfficeBearer.name.trim(),
      phone: newOfficeBearer.phone.trim() || null,
      whatsapp: newOfficeBearer.whatsapp.trim() || null,
      email: newOfficeBearer.email.trim() || null,
      display_order: nextOrder,
    };

    const { error } = await supabase.from("office_bearers").insert([payload]);

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

    await loadOfficeBearers();
    alert("Office bearer added.");
  }

  function startEditOfficeBearer(item) {
    setEditingOfficeBearerId(item.id);
    setEditingOfficeBearer({
      role: safeString(item.role),
      name: safeString(item.name),
      phone: safeString(item.phone),
      whatsapp: safeString(item.whatsapp),
      email: safeString(item.email),
    });
  }

  function cancelEditOfficeBearer() {
    setEditingOfficeBearerId(null);
    setEditingOfficeBearer({
      role: "",
      name: "",
      phone: "",
      whatsapp: "",
      email: "",
    });
  }

  async function saveEditOfficeBearer(id) {
    if (!editingOfficeBearer.role.trim() || !editingOfficeBearer.name.trim()) {
      alert("Please enter role and name.");
      return;
    }

    const payload = {
      role: editingOfficeBearer.role.trim(),
      name: editingOfficeBearer.name.trim(),
      phone: editingOfficeBearer.phone.trim() || null,
      whatsapp: editingOfficeBearer.whatsapp.trim() || null,
      email: editingOfficeBearer.email.trim() || null,
    };

    const { error } = await supabase.from("office_bearers").update(payload).eq("id", id);

    if (error) {
      alert(error.message || "Could not update office bearer.");
      return;
    }

    cancelEditOfficeBearer();
    loadOfficeBearers();
  }

  async function deleteOfficeBearer(id) {
    if (!window.confirm("Delete this office bearer?")) return;

    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) {
      alert(error.message || "Could not delete office bearer.");
      return;
    }

    loadOfficeBearers();
  }

  async function addCoach() {
    if (!newCoach.name.trim()) {
      alert("Please enter coach name.");
      return;
    }

    const { error } = await supabase.from("club_coaches").insert([
      {
        name: newCoach.name.trim(),
        phone: newCoach.phone.trim() || null,
        whatsapp: newCoach.whatsapp.trim() || null,
        email: newCoach.email.trim() || null,
        notes: newCoach.notes.trim() || null,
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

  function startEditCoach(coach) {
    setEditingCoachId(coach.id);
    setEditingCoach({
      name: safeString(coach.name),
      phone: safeString(coach.phone),
      whatsapp: safeString(coach.whatsapp),
      email: safeString(coach.email),
      notes: safeString(coach.notes),
    });
  }

  function cancelEditCoach() {
    setEditingCoachId(null);
    setEditingCoach({
      name: "",
      phone: "",
      whatsapp: "",
      email: "",
      notes: "",
    });
  }

  async function saveEditCoach(id) {
    if (!editingCoach.name.trim()) {
      alert("Please enter coach name.");
      return;
    }

    const payload = {
      name: editingCoach.name.trim(),
      phone: editingCoach.phone.trim() || null,
      whatsapp: editingCoach.whatsapp.trim() || null,
      email: editingCoach.email.trim() || null,
      notes: editingCoach.notes.trim() || null,
    };

    const { error } = await supabase.from("club_coaches").update(payload).eq("id", id);

    if (error) {
      alert(error.message || "Could not update coach.");
      return;
    }

    cancelEditCoach();
    loadCoaches();
  }

  async function deleteCoach(id) {
    if (!window.confirm("Delete this coach?")) return;

    const { error } = await supabase.from("club_coaches").delete().eq("id", id);
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

  function startEditDocument(doc) {
    setEditingDocumentId(doc.id);
    setEditingDocument({
      title: safeString(doc.title),
      file_url: safeString(doc.file_url),
    });
  }

  function cancelEditDocument() {
    setEditingDocumentId(null);
    setEditingDocument({
      title: "",
      file_url: "",
    });
  }

  async function saveEditDocument(id) {
    if (!editingDocument.title.trim()) {
      alert("Please enter a document title.");
      return;
    }

    const { error } = await supabase
      .from("documents")
      .update({
        title: editingDocument.title.trim(),
        file_url: editingDocument.file_url.trim() || null,
      })
      .eq("id", id);

    if (error) {
      alert(error.message || "Could not update document.");
      return;
    }

    cancelEditDocument();
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
                    {" "}
                    — repeats every <strong>{getDayNameFromDate(newEvent.event_date)}</strong> until{" "}
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

        {diaryEvents.length === 0 ? (
          <p style={styles.emptyText}>No diary items yet.</p>
        ) : (
          <div style={styles.listWrap}>
            {diaryEvents.map((event) => (
              <div key={event.id} style={styles.listCard}>
                {editingEventId === event.id ? (
                  <>
                    <div style={styles.formGrid}>
                      <input
                        style={styles.input}
                        placeholder="Title"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      />
                      <input
                        style={styles.input}
                        type="date"
                        value={editingEvent.event_date}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, event_date: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Time"
                        value={editingEvent.event_time}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, event_time: e.target.value })
                        }
                      />
                    </div>
                    <textarea
                      style={styles.textarea}
                      placeholder="Details"
                      value={editingEvent.details}
                      onChange={(e) => setEditingEvent({ ...editingEvent, details: e.target.value })}
                    />
                    <div style={styles.contactButtons}>
                      <button style={styles.primaryBtn} onClick={() => saveEditEvent(event.id)}>
                        Save
                      </button>
                      <button style={styles.secondaryBtn} onClick={cancelEditEvent}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.eventTitle}>{safeString(event.title)}</div>
                    <div style={styles.eventDate}>{formatDate(event.event_date)}</div>

                    {shouldShowTime(event.event_time) ? (
                      <div style={styles.eventMeta}>Time: {event.event_time}</div>
                    ) : null}

                    {event.details ? (
                      <div style={styles.eventDetails}>{event.details}</div>
                    ) : null}

                    {adminMode ? (
                      <div style={styles.contactButtons}>
                        <button style={styles.primaryBtn} onClick={() => startEditEvent(event)}>
                          Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => deleteEvent(event.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
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
                {editingNoticeId === notice.id ? (
                  <>
                    <input
                      style={styles.input}
                      placeholder="Notice title"
                      value={editingNotice.title}
                      onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                    />
                    <textarea
                      style={styles.textarea}
                      placeholder="Notice content"
                      value={editingNotice.content}
                      onChange={(e) =>
                        setEditingNotice({ ...editingNotice, content: e.target.value })
                      }
                    />
                    <div style={styles.contactButtons}>
                      <button style={styles.primaryBtn} onClick={() => saveEditNotice(notice.id)}>
                        Save
                      </button>
                      <button style={styles.secondaryBtn} onClick={cancelEditNotice}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.noticeTitle}>{safeString(notice.title)}</div>
                    <div style={styles.noticeBody}>{safeString(notice.content)}</div>
                    {adminMode ? (
                      <div style={styles.contactButtons}>
                        <button style={styles.primaryBtn} onClick={() => startEditNotice(notice)}>
                          Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => deleteNotice(notice.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
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
              {editingMemberId === member.id ? (
                <>
                  <div style={styles.formGrid}>
                    <input
                      style={styles.input}
                      placeholder="Full name"
                      value={editingMember.full_name}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, full_name: e.target.value })
                      }
                    />
                    <input
                      style={styles.input}
                      placeholder="Phone"
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    />
                    <input
                      style={styles.input}
                      placeholder="WhatsApp"
                      value={editingMember.whatsapp}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, whatsapp: e.target.value })
                      }
                    />
                    <input
                      style={styles.input}
                      placeholder="Email"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    />
                    <select
                      style={styles.input}
                      value={editingMember.category}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, category: e.target.value })
                      }
                    >
                      <option value="gents">Gents</option>
                      <option value="ladies">Ladies</option>
                      <option value="associate">Associate</option>
                    </select>
                  </div>
                  <div style={styles.contactButtons}>
                    <button style={styles.primaryBtn} onClick={() => saveEditMember(member.id)}>
                      Save
                    </button>
                    <button style={styles.secondaryBtn} onClick={cancelEditMember}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.noticeTitle}>{safeString(member.full_name)}</div>
                  {member.phone ? <div style={styles.infoLine}>Phone: {member.phone}</div> : null}
                  {member.whatsapp ? (
                    <div style={styles.infoLine}>WhatsApp: {member.whatsapp}</div>
                  ) : null}
                  {member.email ? <div style={styles.infoLine}>Email: {member.email}</div> : null}
                  <ContactButtons item={member} />
                  {adminMode ? (
                    <div style={styles.contactButtons}>
                      <button style={styles.primaryBtn} onClick={() => startEditMember(member)}>
                        Edit
                      </button>
                      <button style={styles.deleteBtn} onClick={() => deleteMember(member.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </>
              )}
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
                <option value="gents">Gents</option>
                <option value="ladies">Ladies</option>
                <option value="associate">Associate</option>
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
                onChange={(e) =>
                  setNewOfficeBearer({ ...newOfficeBearer, whatsapp: e.target.value })
                }
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
                {editingOfficeBearerId === item.id ? (
                  <>
                    <div style={styles.formGrid}>
                      <input
                        style={styles.input}
                        placeholder="Role"
                        value={editingOfficeBearer.role}
                        onChange={(e) =>
                          setEditingOfficeBearer({ ...editingOfficeBearer, role: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Name"
                        value={editingOfficeBearer.name}
                        onChange={(e) =>
                          setEditingOfficeBearer({ ...editingOfficeBearer, name: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Phone"
                        value={editingOfficeBearer.phone}
                        onChange={(e) =>
                          setEditingOfficeBearer({ ...editingOfficeBearer, phone: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="WhatsApp"
                        value={editingOfficeBearer.whatsapp}
                        onChange={(e) =>
                          setEditingOfficeBearer({
                            ...editingOfficeBearer,
                            whatsapp: e.target.value,
                          })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Email"
                        value={editingOfficeBearer.email}
                        onChange={(e) =>
                          setEditingOfficeBearer({ ...editingOfficeBearer, email: e.target.value })
                        }
                      />
                    </div>
                    <div style={styles.contactButtons}>
                      <button
                        style={styles.primaryBtn}
                        onClick={() => saveEditOfficeBearer(item.id)}
                      >
                        Save
                      </button>
                      <button style={styles.secondaryBtn} onClick={cancelEditOfficeBearer}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.noticeTitle}>{safeString(item.role)}</div>
                    <div style={styles.infoLineStrong}>{safeString(item.name)}</div>
                    {item.phone ? <div style={styles.infoLine}>Phone: {item.phone}</div> : null}
                    {item.whatsapp ? (
                      <div style={styles.infoLine}>WhatsApp: {item.whatsapp}</div>
                    ) : null}
                    {item.email ? <div style={styles.infoLine}>Email: {item.email}</div> : null}
                    <ContactButtons item={item} />
                    {adminMode ? (
                      <div style={styles.contactButtons}>
                        <button
                          style={styles.primaryBtn}
                          onClick={() => startEditOfficeBearer(item)}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => deleteOfficeBearer(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
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
                {editingCoachId === coach.id ? (
                  <>
                    <div style={styles.formGrid}>
                      <input
                        style={styles.input}
                        placeholder="Name"
                        value={editingCoach.name}
                        onChange={(e) => setEditingCoach({ ...editingCoach, name: e.target.value })}
                      />
                      <input
                        style={styles.input}
                        placeholder="Phone"
                        value={editingCoach.phone}
                        onChange={(e) =>
                          setEditingCoach({ ...editingCoach, phone: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="WhatsApp"
                        value={editingCoach.whatsapp}
                        onChange={(e) =>
                          setEditingCoach({ ...editingCoach, whatsapp: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Email"
                        value={editingCoach.email}
                        onChange={(e) =>
                          setEditingCoach({ ...editingCoach, email: e.target.value })
                        }
                      />
                      <input
                        style={styles.input}
                        placeholder="Notes"
                        value={editingCoach.notes}
                        onChange={(e) =>
                          setEditingCoach({ ...editingCoach, notes: e.target.value })
                        }
                      />
                    </div>
                    <div style={styles.contactButtons}>
                      <button style={styles.primaryBtn} onClick={() => saveEditCoach(coach.id)}>
                        Save
                      </button>
                      <button style={styles.secondaryBtn} onClick={cancelEditCoach}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.noticeTitle}>{safeString(coach.name)}</div>
                    {coach.phone ? <div style={styles.infoLine}>Phone: {coach.phone}</div> : null}
                    {coach.whatsapp ? (
                      <div style={styles.infoLine}>WhatsApp: {coach.whatsapp}</div>
                    ) : null}
                    {coach.email ? <div style={styles.infoLine}>Email: {coach.email}</div> : null}
                    {coach.notes ? <div style={styles.infoLine}>{coach.notes}</div> : null}
                    <ContactButtons item={coach} />
                    {adminMode ? (
                      <div style={styles.contactButtons}>
                        <button style={styles.primaryBtn} onClick={() => startEditCoach(coach)}>
                          Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => deleteCoach(coach.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
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
                {editingDocumentId === doc.id ? (
                  <>
                    <input
                      style={styles.input}
                      placeholder="Document title"
                      value={editingDocument.title}
                      onChange={(e) =>
                        setEditingDocument({ ...editingDocument, title: e.target.value })
                      }
                    />
                    <input
                      style={styles.input}
                      placeholder="Document URL"
                      value={editingDocument.file_url}
                      onChange={(e) =>
                        setEditingDocument({ ...editingDocument, file_url: e.target.value })
                      }
                    />
                    <div style={styles.contactButtons}>
                      <button style={styles.primaryBtn} onClick={() => saveEditDocument(doc.id)}>
                        Save
                      </button>
                      <button style={styles.secondaryBtn} onClick={cancelEditDocument}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" style={styles.link}>
                      {safeString(doc.title, "Open document")}
                    </a>
                    {adminMode ? (
                      <div style={styles.contactButtons}>
                        <button style={styles.primaryBtn} onClick={() => startEditDocument(doc)}>
                          Edit
                        </button>
                        <button style={styles.deleteBtn} onClick={() => deleteDocument(doc.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
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
    background: "linear-gradient(180deg, #990f3d 0%, #8c1738 35%, #6a0f2e 100%)",
    padding: 14,
    fontFamily: "Arial, sans-serif",
    color: "#23364f",
  },
  wrap: {
    maxWidth: 1480,
    margin: "0 auto",
  },
  header: {
    background: "linear-gradient(135deg, #9e2648 0%, #8d2743 100%)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
    width: 96,
    height: 96,
    objectFit: "contain",
    borderRadius: 18,
    background: "#fff",
    padding: 6,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.08,
    color: "#ffffff",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 700,
    color: "#f7dde6",
  },
  adminStripWrap: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-end",
  },
  smallAdminToggle: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 10,
    padding: "8px 14px",
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
    color: "#fff",
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
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: "12px 18px",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
  },
  activeTab: {
    background: "#ffffff",
    color: "#8b2940",
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
    background: "#ece8eb",
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
    wordBreak: "break-word",
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
    background: "#c70039",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontSize: 15,
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
