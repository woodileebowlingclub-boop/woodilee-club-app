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

const DOCUMENT_CATEGORIES = [
  "General",
  "Competitions",
  "Rules",
  "Forms",
  "Minutes",
  "Finance",
  "Notices",
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function cleanPhone(phone) {
  return safeString(phone).replace(/\s+/g, "");
}

function formatPhoneForDisplay(phone) {
  const cleaned = safeString(phone).replace(/\s+/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("07") && cleaned.length === 11) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return safeString(phone);
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return safeString(dateValue);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return safeString(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeValue) {
  if (!timeValue) return "";
  const raw = safeString(timeValue).trim();
  if (!raw) return "";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    const [hours, minutes] = raw.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return raw;
}

function getFileExtension(fileName = "") {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function isViewableFile(url = "", fileName = "") {
  const ext = getFileExtension(fileName || url);
  return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

function getViewerUrl(url = "", fileName = "") {
  const ext = getFileExtension(fileName || url);
  if (ext === "pdf") {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  return url;
}

function sortDocuments(list = [], sortMode = "title-asc") {
  const arr = [...list];
  if (sortMode === "title-asc") {
    return arr.sort((a, b) => safeString(a.title).localeCompare(safeString(b.title), undefined, { sensitivity: "base" }));
  }
  if (sortMode === "title-desc") {
    return arr.sort((a, b) => safeString(b.title).localeCompare(safeString(a.title), undefined, { sensitivity: "base" }));
  }
  if (sortMode === "category-asc") {
    return arr.sort((a, b) => {
      const categoryCompare = safeString(a.category).localeCompare(safeString(b.category), undefined, { sensitivity: "base" });
      if (categoryCompare !== 0) return categoryCompare;
      return safeString(a.title).localeCompare(safeString(b.title), undefined, { sensitivity: "base" });
    });
  }
  if (sortMode === "newest") {
    return arr.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }
  if (sortMode === "oldest") {
    return arr.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }
  return arr;
}

function sortByName(list, key = "name") {
  return [...list].sort((a, b) => safeString(a[key] || a.full_name).localeCompare(safeString(b[key] || b.full_name), undefined, { sensitivity: "base" }));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [eventForm, setEventForm] = useState({ id: null, title: "", event_date: "", event_time: "", location: "", description: "" });
  const [noticeForm, setNoticeForm] = useState({ id: null, title: "", description: "", url: "" });
  const [memberForm, setMemberForm] = useState({ id: null, full_name: "", category: "Gents", phone: "", email: "" });
  const [officeForm, setOfficeForm] = useState({ id: null, name: "", role: "", phone: "", email: "", sort_order: "" });
  const [coachForm, setCoachForm] = useState({ id: null, name: "", role: "Coach", phone: "", email: "", sort_order: "" });

  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("General");
  const [docDescription, setDocDescription] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docSort, setDocSort] = useState("title-asc");
  const [docViewerUrl, setDocViewerUrl] = useState("");
  const [docViewerTitle, setDocViewerTitle] = useState("");

  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isSavingOffice, setIsSavingOffice] = useState(false);
  const [isSavingCoach, setIsSavingCoach] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const groupedMembers = useMemo(() => {
    const groups = { Gents: [], Ladies: [], Associates: [] };
    members.forEach((member) => {
      const category = safeString(member.category).toLowerCase();
      if (category.includes("lad")) groups.Ladies.push(member);
      else if (category.includes("assoc")) groups.Associates.push(member);
      else groups.Gents.push(member);
    });
    return groups;
  }, [members]);

  async function fetchEvents() {
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      console.error("Error loading events:", error.message);
      return;
    }
    const cleaned = (data || []).map((event) => ({
      ...event,
      title: event.title || event.name || "",
      event_date: event.event_date || event.date || "",
      event_time: event.event_time || event.time || "",
      location: event.location || "",
      description: event.description || event.details || "",
    }));
    cleaned.sort((a, b) => {
      const keyA = `${a.event_date || "9999-12-31"}T${a.event_time || "23:59"}`;
      const keyB = `${b.event_date || "9999-12-31"}T${b.event_time || "23:59"}`;
      return new Date(keyA).getTime() - new Date(keyB).getTime();
    });
    setEvents(cleaned);
  }

  async function fetchNotices() {
    const { data, error } = await supabase.from("information_posts").select("*");
    if (error) {
      console.error("Error loading notices:", error.message);
      return;
    }
    const cleaned = (data || []).map((notice) => ({
      ...notice,
      title: notice.title || "Notice",
      description: notice.description || notice.content || "",
      url: notice.url || "",
    }));
    cleaned.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    setNotices(cleaned);
  }

  async function fetchMembers() {
    const { data, error } = await supabase.from("members").select("*");
    if (error) {
      console.error("Error loading members:", error.message);
      return;
    }
    const cleaned = (data || []).map((member) => ({
      ...member,
      full_name: member.full_name || member.name || "",
      category: member.category || "Gents",
      phone: member.phone || member.mobile || member.contact_number || "",
      email: member.email || "",
    }));
    setMembers(sortByName(cleaned, "full_name"));
  }

  async function fetchOfficeBearers() {
    const { data, error } = await supabase.from("office_bearers").select("*");
    if (error) {
      console.error("Error loading office bearers:", error.message);
      return;
    }
    const cleaned = [...(data || [])].sort((a, b) => {
      const sortA = Number(a.sort_order ?? 9999);
      const sortB = Number(b.sort_order ?? 9999);
      if (sortA !== sortB) return sortA - sortB;
      return safeString(a.name).localeCompare(safeString(b.name), undefined, { sensitivity: "base" });
    });
    setOfficeBearers(cleaned);
  }

  async function fetchCoaches() {
    const { data, error } = await supabase.from("club_coaches").select("*");
    if (error) {
      console.error("Error loading coaches:", error.message);
      return;
    }
    const cleaned = [...(data || [])].sort((a, b) => {
      const sortA = Number(a.sort_order ?? 9999);
      const sortB = Number(b.sort_order ?? 9999);
      if (sortA !== sortB) return sortA - sortB;
      return safeString(a.name).localeCompare(safeString(b.name), undefined, { sensitivity: "base" });
    });
    setCoaches(cleaned);
  }

  async function fetchDocuments() {
    const { data, error } = await supabase.from("documents").select("*");
    if (error) {
      console.error("Error loading documents:", error.message);
      return;
    }
    const cleaned = (data || []).map((doc) => ({
      ...doc,
      file_url: doc.file_url || doc.url || "",
      category: doc.category || "General",
      description: doc.description || "",
      button_text: doc.button_text || "Open",
    }));
    setDocuments(sortDocuments(cleaned, docSort));
  }

  async function loadAllData() {
    setLoading(true);
    await Promise.all([
      fetchEvents(),
      fetchNotices(),
      fetchMembers(),
      fetchOfficeBearers(),
      fetchCoaches(),
      fetchDocuments(),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    setDocuments((prev) => sortDocuments(prev, docSort));
  }, [docSort]);

  async function handleAdminLogin() {
    const pin = window.prompt("Enter admin PIN");
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      window.alert("Admin mode enabled.");
    } else if (pin !== null) {
      window.alert("Incorrect PIN.");
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    window.alert("Admin mode turned off.");
  }

  function resetEventForm() {
    setEventForm({ id: null, title: "", event_date: "", event_time: "", location: "", description: "" });
  }
  function resetNoticeForm() {
    setNoticeForm({ id: null, title: "", description: "", url: "" });
  }
  function resetMemberForm() {
    setMemberForm({ id: null, full_name: "", category: "Gents", phone: "", email: "" });
  }
  function resetOfficeForm() {
    setOfficeForm({ id: null, name: "", role: "", phone: "", email: "", sort_order: "" });
  }
  function resetCoachForm() {
    setCoachForm({ id: null, name: "", role: "Coach", phone: "", email: "", sort_order: "" });
  }

  function handleEditEvent(item) {
    setEventForm({
      id: item.id || null,
      title: safeString(item.title),
      event_date: safeString(item.event_date),
      event_time: safeString(item.event_time),
      location: safeString(item.location),
      description: safeString(item.description),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditNotice(item) {
    setNoticeForm({
      id: item.id || null,
      title: safeString(item.title),
      description: safeString(item.description),
      url: safeString(item.url),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditMember(item) {
    setMemberForm({
      id: item.id || null,
      full_name: safeString(item.full_name),
      category: safeString(item.category, "Gents"),
      phone: safeString(item.phone),
      email: safeString(item.email),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditOffice(item) {
    setOfficeForm({
      id: item.id || null,
      name: safeString(item.name),
      role: safeString(item.role),
      phone: safeString(item.phone),
      email: safeString(item.email),
      sort_order: safeString(item.sort_order),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditCoach(item) {
    setCoachForm({
      id: item.id || null,
      name: safeString(item.name),
      role: safeString(item.role, "Coach"),
      phone: safeString(item.phone),
      email: safeString(item.email),
      sort_order: safeString(item.sort_order),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.event_date) {
      window.alert("Please enter a title and date.");
      return;
    }
    setIsSavingEvent(true);
    try {
      const payload = {
        title: eventForm.title.trim(),
        event_date: eventForm.event_date,
        event_time: eventForm.event_time || null,
        location: eventForm.location.trim() || null,
        description: eventForm.description.trim() || null,
      };
      const response = eventForm.id
        ? await supabase.from("events").update(payload).eq("id", eventForm.id)
        : await supabase.from("events").insert([payload]);
      if (response.error) {
        window.alert(`Could not save diary item: ${response.error.message}`);
        return;
      }
      await fetchEvents();
      resetEventForm();
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function handleSaveNotice() {
    if (!noticeForm.title.trim()) {
      window.alert("Please enter a notice title.");
      return;
    }
    setIsSavingNotice(true);
    try {
      const payload = {
        title: noticeForm.title.trim(),
        description: noticeForm.description.trim() || null,
        content: noticeForm.description.trim() || null,
        url: noticeForm.url.trim() || null,
      };
      const response = noticeForm.id
        ? await supabase.from("information_posts").update(payload).eq("id", noticeForm.id)
        : await supabase.from("information_posts").insert([payload]);
      if (response.error) {
        window.alert(`Could not save notice: ${response.error.message}`);
        return;
      }
      await fetchNotices();
      resetNoticeForm();
    } finally {
      setIsSavingNotice(false);
    }
  }

  async function handleSaveMember() {
    if (!memberForm.full_name.trim()) {
      window.alert("Please enter the member name.");
      return;
    }
    setIsSavingMember(true);
    try {
      const payload = {
        full_name: memberForm.full_name.trim(),
        category: memberForm.category,
        phone: memberForm.phone.trim() || null,
        email: memberForm.email.trim() || null,
      };
      const response = memberForm.id
        ? await supabase.from("members").update(payload).eq("id", memberForm.id)
        : await supabase.from("members").insert([payload]);
      if (response.error) {
        window.alert(`Could not save member: ${response.error.message}`);
        return;
      }
      await fetchMembers();
      resetMemberForm();
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleSaveOffice() {
    if (!officeForm.name.trim() || !officeForm.role.trim()) {
      window.alert("Please enter name and role.");
      return;
    }
    setIsSavingOffice(true);
    try {
      const payload = {
        name: officeForm.name.trim(),
        role: officeForm.role.trim(),
        phone: officeForm.phone.trim() || null,
        email: officeForm.email.trim() || null,
        sort_order: officeForm.sort_order === "" ? null : Number(officeForm.sort_order),
      };
      const response = officeForm.id
        ? await supabase.from("office_bearers").update(payload).eq("id", officeForm.id)
        : await supabase.from("office_bearers").insert([payload]);
      if (response.error) {
        window.alert(`Could not save office bearer: ${response.error.message}`);
        return;
      }
      await fetchOfficeBearers();
      resetOfficeForm();
    } finally {
      setIsSavingOffice(false);
    }
  }

  async function handleSaveCoach() {
    if (!coachForm.name.trim()) {
      window.alert("Please enter coach name.");
      return;
    }
    setIsSavingCoach(true);
    try {
      const payload = {
        name: coachForm.name.trim(),
        role: coachForm.role.trim() || "Coach",
        phone: coachForm.phone.trim() || null,
        email: coachForm.email.trim() || null,
        sort_order: coachForm.sort_order === "" ? null : Number(coachForm.sort_order),
      };
      const response = coachForm.id
        ? await supabase.from("club_coaches").update(payload).eq("id", coachForm.id)
        : await supabase.from("club_coaches").insert([payload]);
      if (response.error) {
        window.alert(`Could not save coach: ${response.error.message}`);
        return;
      }
      await fetchCoaches();
      resetCoachForm();
    } finally {
      setIsSavingCoach(false);
    }
  }

  async function handleDeleteRow(table, id, refreshFn, label, resetFn, currentId) {
    const ok = window.confirm(`Delete this ${label}?`);
    if (!ok) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      window.alert(`Could not delete ${label}: ${error.message}`);
      return;
    }
    if (currentId === id && resetFn) resetFn();
    await refreshFn();
  }

  async function handleDocumentUpload() {
    if (!docTitle.trim()) {
      window.alert("Please enter a document title.");
      return;
    }
    if (!docFile) {
      window.alert("Please choose a file.");
      return;
    }
    setIsUploadingDoc(true);
    try {
      const safeName = docFile.name.replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, docFile, { upsert: false });
      if (uploadError) {
        window.alert(`File upload failed: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || "";
      const { error: insertError } = await supabase.from("documents").insert([
        {
          title: docTitle.trim(),
          description: docDescription.trim() || null,
          category: docCategory,
          file_name: docFile.name,
          file_url: publicUrl,
          button_text: "Open",
        },
      ]);
      if (insertError) {
        window.alert(`Document record could not be saved: ${insertError.message}`);
        return;
      }
      setDocTitle("");
      setDocCategory("General");
      setDocDescription("");
      setDocFile(null);
      const input = document.getElementById("document-upload-input");
      if (input) input.value = "";
      await fetchDocuments();
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function handleDeleteDocument(doc) {
    const ok = window.confirm(`Delete \"${safeString(doc.title, "this document")}\"?`);
    if (!ok) return;
    const fileUrl = doc.file_url || doc.url || "";
    if (fileUrl) {
      const parts = fileUrl.split("/");
      const storageFileName = parts[parts.length - 1];
      if (storageFileName) {
        await supabase.storage.from(BUCKET).remove([storageFileName]);
      }
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      window.alert(`Could not delete document: ${error.message}`);
      return;
    }
    setDocViewerUrl("");
    setDocViewerTitle("");
    await fetchDocuments();
  }

  function handleOpenDocument(doc) {
    const fileUrl = doc.file_url || doc.url || "";
    if (!fileUrl) {
      window.alert("This document has no file link.");
      return;
    }
    if (isViewableFile(fileUrl, doc.file_name)) {
      setDocViewerTitle(doc.title || "Document");
      setDocViewerUrl(getViewerUrl(fileUrl, doc.file_name));
    } else {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  }

  function renderPersonCard(person, type, editHandler, deleteHandler) {
    const phone = person.phone || person.mobile || person.contact_number || "";
    const displayPhone = formatPhoneForDisplay(phone);
    const telPhone = cleanPhone(phone);
    const whatsappPhone = telPhone.startsWith("0") ? `44${telPhone.slice(1)}` : telPhone;
    return (
      <div key={`${type}-${person.id || person.name || person.full_name}`} style={styles.personCard}>
        <div>
          <div style={styles.personName}>{person.full_name || person.name || "Unnamed"}</div>
          {person.role ? <div style={styles.personRole}>{person.role}</div> : null}
          {person.category ? <div style={styles.personRole}>{person.category}</div> : null}
          {person.email ? <div style={styles.personDetail}>{person.email}</div> : null}
          {displayPhone ? <div style={styles.personDetail}>{displayPhone}</div> : null}
        </div>
        <div style={styles.personActionsWrap}>
          {(telPhone || whatsappPhone) && (
            <div style={styles.personActions}>
              {telPhone ? <a href={`tel:${telPhone}`} style={styles.actionLink}>Call</a> : null}
              {whatsappPhone ? <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" style={styles.actionLinkSecondary}>WhatsApp</a> : null}
            </div>
          )}
          {isAdmin ? (
            <div style={styles.inlineActionRow}>
              <button style={styles.secondaryButton} onClick={() => editHandler(person)}>Edit</button>
              <button style={styles.deleteButton} onClick={() => deleteHandler(person.id)}>Delete</button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return <div>Replace with code from previous canvas if needed.</div>;
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg, #7f112f 0%, #8f1736 35%, #a11f44 100%)", padding: 18, fontFamily: "Arial, sans-serif" },
  wrap: { maxWidth: 1280, margin: "0 auto" },
  header: { background: "rgba(255,255,255,0.10)", borderRadius: 28, padding: 20, marginBottom: 18, boxShadow: "0 10px 26px rgba(0,0,0,0.18)", backdropFilter: "blur(4px)" },
  headerTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 },
  headerBrand: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  logo: { width: 92, height: 92, objectFit: "contain", borderRadius: 18, background: "rgba(255,255,255,0.95)", padding: 8 },
  title: { margin: 0, color: "#fff", fontSize: "2.3rem", fontWeight: 800, lineHeight: 1.1 },
  subtitle: { margin: "8px 0 0 0", color: "#f9e9ef", fontSize: "1.08rem", fontWeight: 600 },
  headerButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  adminButton: { background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 14, padding: "12px 18px", fontWeight: 700, cursor: "pointer" },
  adminButtonActive: { background: "#ffffff", color: "#8b1e3f", border: "1px solid #ffffff", borderRadius: 14, padding: "12px 18px", fontWeight: 800, cursor: "pointer" },
  tabBar: { display: "flex", gap: 10, flexWrap: "wrap" },
  tabButton: { background: "rgba(255,255,255,0.16)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 14, padding: "12px 18px", fontWeight: 700, fontSize: "1rem", cursor: "pointer" },
  activeTabButton: { background: "#ffffff", color: "#8b1e3f", border: "1px solid #ffffff", borderRadius: 14, padding: "12px 18px", fontWeight: 800, fontSize: "1rem", cursor: "pointer" },
  loadingCard: { background: "#f4eff2", borderRadius: 24, padding: 24, color: "#8b1e3f", fontSize: "1.2rem", fontWeight: 700 },
  sectionCard: { background: "#f4eff2", borderRadius: 24, padding: 22, marginBottom: 18, boxShadow: "0 10px 24px rgba(0,0,0,0.10)" },
  sectionTitle: { margin: "0 0 18px 0", color: "#8b1e3f", fontSize: "2rem", fontWeight: 800 },
  subTitle: { margin: "0 0 14px 0", color: "#8b1e3f", fontSize: "1.35rem", fontWeight: 800 },
  homeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 },
  infoTile: { background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e1d3d8" },
  tileNumber: { color: "#8b1e3f", fontSize: "2rem", fontWeight: 800, marginBottom: 6 },
  tileLabel: { color: "#6d4956", fontSize: "1rem", fontWeight: 700 },
  panel: { background: "#efe5ea", borderRadius: 20, padding: 18, marginBottom: 18 },
  stack: { display: "flex", flexDirection: "column", gap: 14 },
  listCard: { background: "#fff", borderRadius: 18, padding: 16, border: "1px solid #e1d3d8" },
  listTitle: { color: "#8b1e3f", fontSize: "1.15rem", fontWeight: 800, marginBottom: 6 },
  listMeta: { color: "#6d4956", fontSize: "0.96rem", fontWeight: 700, marginBottom: 8 },
  listBody: { color: "#412a33", fontSize: "1rem", lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" },
  inlineLink: { display: "inline-block", marginTop: 10, color: "#8b1e3f", fontWeight: 800, textDecoration: "none" },
  peopleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14 },
  personCard: { background: "#fff", borderRadius: 18, padding: 16, border: "1px solid #e1d3d8", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" },
  personName: { color: "#8b1e3f", fontSize: "1.08rem", fontWeight: 800, marginBottom: 6 },
  personRole: { color: "#6d4956", fontWeight: 700, marginBottom: 6 },
  personDetail: { color: "#412a33", fontSize: "0.98rem", marginBottom: 4 },
  personActionsWrap: { display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" },
  personActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionLink: { background: "#8b1e3f", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: "0.95rem" },
  actionLinkSecondary: { background: "#ffffff", color: "#8b1e3f", textDecoration: "none", border: "2px solid #8b1e3f", borderRadius: 12, padding: "8px 12px", fontWeight: 700, fontSize: "0.95rem" },
  adminCard: { background: "#efe5ea", borderRadius: 20, padding: 18, marginBottom: 20 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid #d2c5cb", marginBottom: 12, fontSize: "1rem", background: "#fff" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid #d2c5cb", marginBottom: 12, fontSize: "1rem", background: "#fff", resize: "vertical", fontFamily: "Arial, sans-serif" },
  fileInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid #d2c5cb", marginBottom: 12, fontSize: "1rem", background: "#fff" },
  primaryButton: { background: "#8b1e3f", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, fontSize: "1rem", cursor: "pointer" },
  primaryButtonDisabled: { background: "#b88a98", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, fontSize: "1rem", cursor: "not-allowed" },
  secondaryButton: { background: "#8b1e3f", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" },
  deleteButton: { background: "#d9044b", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" },
  linkButton: { display: "inline-block", background: "#ffffff", color: "#8b1e3f", border: "2px solid #8b1e3f", borderRadius: 12, padding: "8px 14px", fontWeight: 800, fontSize: "0.95rem", textDecoration: "none" },
  documentsToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  documentsToolbarLeft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  sortLabel: { color: "#6f2237", fontSize: "1rem" },
  sortSelect: { padding: "10px 12px", borderRadius: 10, border: "1px solid #d2c5cb", fontSize: "0.95rem", background: "#fff" },
  documentsList: { display: "flex", flexDirection: "column", gap: 14 },
  documentItem: { background: "#f7f3f5", border: "1px solid #dfd2d8", borderRadius: 18, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" },
  documentInfo: { flex: 1, minWidth: 240 },
  documentTitleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 },
  documentTitle: { fontSize: "1.1rem", fontWeight: 800, color: "#8b1e3f" },
  documentCategory: { background: "#8b1e3f", color: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: "0.8rem", fontWeight: 700 },
  documentMeta: { color: "#6b5a61", fontSize: "0.95rem", marginTop: 4 },
  documentMetaSmall: { color: "#8b7680", fontSize: "0.85rem", marginTop: 4 },
  documentActions: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  viewerCard: { marginTop: 22, background: "#fff", borderRadius: 18, padding: 14, border: "1px solid #dfd2d8" },
  viewerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  viewerTitle: { fontSize: "1.2rem", fontWeight: 800, color: "#8b1e3f", margin: 0 },
  viewerFrame: { width: "100%", height: "700px", border: "none", borderRadius: 12, background: "#f5f5f5" },
  emptyMessage: { padding: 18, borderRadius: 14, background: "#f7f3f5", color: "#6f2237", fontWeight: 700 },
  formButtonRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  linkLikeButton: { background: "#ffffff", color: "#8b1e3f", border: "2px solid #8b1e3f", borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" },
  inlineActionRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
};
