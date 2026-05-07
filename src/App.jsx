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
  { key: "competitions", label: "Competitions" },
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

function isWebLink(value) {
  const text = safeString(value).trim().toLowerCase();
  return text.startsWith("http://") || text.startsWith("https://");
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
    file_url: getFirstValue(row, ["file_url", "url", "link"]),
    date_text: getFirstValue(row, ["date_text"]),
  };
}

function normaliseNotice(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "heading", "name"], "Notice"),
    content: getFirstValue(row, ["message", "content", "details", "description", "text"]),
    created_at: getFirstValue(row, ["created_at", "date_posted"]),
  };
}

function normaliseCompetition(row) {
  return {
    id: getFirstValue(row, ["id"]),
    title: getFirstValue(row, ["title", "name", "competition_name"], "Competition"),
    details: getFirstValue(row, ["details", "content", "description", "notes"]),
    file_url: getFirstValue(row, ["file_url", "url", "link"]),
    event_date: getFirstValue(row, ["event_date", "competition_date", "date"]),
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
  const [competitions, setCompetitions] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [newEvent, setNewEvent] = useState({
    title: "",
    event_date: "",
    event_time: "",
    details: "",
    file_url: "",
    repeat_type: "none",
    repeat_until: "",
  });

  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
  });

  const [newCompetition, setNewCompetition] = useState({
    title: "",
    details: "",
    event_date: "",
    file_url: "",
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
    file_url: "",
  });

  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editingNotice, setEditingNotice] = useState({
    title: "",
    content: "",
  });

  const [editingCompetitionId, setEditingCompetitionId] = useState(null);
  const [editingCompetition, setEditingCompetition] = useState({
    title: "",
    details: "",
    event_date: "",
    file_url: "",
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
      loadCompetitions(),
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
      .order("date_posted", { ascending: false });

    if (!error) {
      setNotices((data || []).map(normaliseNotice));
    }
  }

  async function loadCompetitions() {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error) {
      setCompetitions((data || []).map(normaliseCompetition));
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

  const sortedCompetitions = useMemo(() => {
    return [...competitions].sort((a, b) => {
      const aHasDate = !!a.event_date;
      const bHasDate = !!b.event_date;

      if (aHasDate && bHasDate) {
        return new Date(a.event_date) - new Date(b.event_date);
      }
      if (aHasDate && !bHasDate) return -1;
      if (!aHasDate && bHasDate) return 1;
      return safeString(a.title).localeCompare(safeString(b.title));
    });
  }, [competitions]);

  const nextUpcomingEvent = diaryEvents.length > 0 ? diaryEvents[0] : null;
  const latestNotices = notices.slice(0, 5);
  const homeCompetitions = sortedCompetitions.slice(0, 5);

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

  async function uploadDiaryFile(file) {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message || "Diary file upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    setNewEvent((prev) => ({
      ...prev,
      file_url: publicData?.publicUrl || "",
    }));

    alert("Diary file uploaded. Now click Add Event.");
  }

  async function uploadDiaryEditFile(file) {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message || "Diary file upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    setEditingEvent((prev) => ({
      ...prev,
      file_url: publicData?.publicUrl || "",
    }));

    alert("Replacement diary file uploaded. Now click Save.");
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
        file_url: newEvent.file_url.trim() || null,
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
      file_url: "",
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
      file_url: safeString(event.file_url),
    });
  }

  function cancelEditEvent() {
    setEditingEventId(null);
    setEditingEvent({
      title: "",
      event_date: "",
      event_time: "",
      details: "",
      file_url: "",
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
      file_url: editingEvent.file_url.trim() || null,
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

  async function addCompetition() {
    if (!newCompetition.title.trim()) {
      alert("Please enter a competition title.");
      return;
    }

    const payload = {
      title: newCompetition.title.trim(),
      details: newCompetition.details.trim() || null,
      event_date: newCompetition.event_date || null,
      file_url: newCompetition.file_url.trim() || null,
    };

    const { error } = await supabase.from("competitions").insert([payload]);

    if (error) {
      alert(error.message || "Could not add competition.");
      return;
    }

    setNewCompetition({
      title: "",
      details: "",
      event_date: "",
      file_url: "",
    });

    await loadCompetitions();
    alert("Competition added.");
  }

  function startEditCompetition(item) {
    setEditingCompetitionId(item.id);
    setEditingCompetition({
      title: safeString(item.title),
      details: safeString(item.details),
      event_date: safeString(item.event_date),
      file_url: safeString(item.file_url),
    });
  }

  function cancelEditCompetition() {
    setEditingCompetitionId(null);
    setEditingCompetition({
      title: "",
      details: "",
      event_date: "",
      file_url: "",
    });
  }

  async function saveEditCompetition(id) {
    if (!editingCompetition.title.trim()) {
      alert("Please enter a competition title.");
      return;
    }

    const payload = {
      title: editingCompetition.title.trim(),
      details: editingCompetition.details.trim() || null,
      event_date: editingCompetition.event_date || null,
      file_url: editingCompetition.file_url.trim() || null,
    };

    const { error } = await supabase.from("competitions").update(payload).eq("id", id);

    if (error) {
      alert(error.message || "Could not update competition.");
      return;
    }

    cancelEditCompetition();
    loadCompetitions();
  }

  async function deleteCompetition(id) {
    if (!window.confirm("Delete this competition?")) return;

    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) {
      alert(error.message || "Could not delete competition.");
      return;
    }

    loadCompetitions();
  }

  async function uploadCompetitionFile(file) {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message || "Competition file upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    setNewCompetition((prev) => ({
      ...prev,
      file_url: publicData?.publicUrl || "",
    }));

    alert("Competition file uploaded. Now click Add Competition.");
  }

  async function uploadCompetitionEditFile(file) {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message || "Competition file upload failed.");
      return;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    setEditingCompetition((prev) => ({
      ...prev,
      file_url: publicData?.publicUrl || "",
    }));

    alert("Replacement file uploaded. Now click Save.");
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
      <div style={styles.grid4}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome</h2>
          <p style={styles.largeText}>
            Welcome to the club app. Use the tabs above to view diary dates,
            notices, competitions, members, office bearers, coaches and documents.
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
              {nextUpcomingEvent.file_url ? (
                <div style={{ marginTop: 10 }}>
                  <a
                    href={nextUpcomingEvent.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    Open file
                  </a>
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
                <div style={styles.noticeBody}>
                  {isWebLink(notice.content) ? (
                    <a
                      href={safeString(notice.content)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      {safeString(notice.content)}
                    </a>
                  ) : (
                    safeString(notice.content)
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Competitions</h2>
          {homeCompetitions.length === 0 ? (
            <p style={styles.emptyText}>No competitions added yet.</p>
          ) : (
            homeCompetitions.map((item) => (
              <div key={item.id} style={styles.noticeCard}>
                <div style={styles.noticeTitle}>{safeString(item.title)}</div>
                {item.event_date ? (
                  <div style={styles.eventMeta}>Date: {formatDate(item.event_date)}</div>
                ) : null}
                {item.details ? <div style={styles.noticeBody}>{safeString(item.details)}</div> : null}
                {item.file_url ? (
                  <div style={{ marginTop: 8 }}>
                    <a href={item.file_url} target="_blank" rel="noreferrer" style={styles.link}>
                      Open file
                    </a>
                  </div>
                ) : null}
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
              <input
                style={styles.input}
                type="file"
                onChange={(e) => uploadDiaryFile(e.target.files?.[0])}
              />

              {newEvent.file_url ? (
                <a
                  href={newEvent.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.link}
                >
                  File uploaded
                </a>
              ) : null}
            </div>

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
                      <input
                        style={styles.input}
                        placeholder="File URL"
                        value={editingEvent.file_url}
                        onChange={(e) =>
                          setEditingEvent({ ...editingEvent, file_url: e.target.value })
                        }
                      />
                    </div>

                    <textarea
                      style={styles.textarea}
                      placeholder="Details"
                      value={editingEvent.details}
                      onChange={(e) => setEditingEvent({ ...editingEvent, details: e.target.value })}
                    />

                    <div style={styles.adminActionRow}>
                      <input
                        style={styles.input}
                        type="file"
                        onChange={(e) => uploadDiaryEditFile(e.target.files?.[0])}
                      />
                    </div>

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

                    {event.file_url ? (
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={event.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          Open file
                        </a>
                      </div>
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
      case "competitions":
        return renderCompetitions();
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

  /* KEEP ALL YOUR EXISTING renderNotices, renderCompetitions, renderMembers,
     renderOfficeBearers, renderCoaches, renderDocuments AND styles BELOW
     EXACTLY AS THEY ARE IN YOUR CURRENT FILE */
}
