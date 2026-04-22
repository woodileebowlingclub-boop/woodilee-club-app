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
    return arr.sort((a, b) =>
      safeString(a.title).localeCompare(safeString(b.title), undefined, { sensitivity: "base" })
    );
  }

  if (sortMode === "title-desc") {
    return arr.sort((a, b) =>
      safeString(b.title).localeCompare(safeString(a.title), undefined, { sensitivity: "base" })
    );
  }

  if (sortMode === "category-asc") {
    return arr.sort((a, b) => {
      const byCategory = safeString(a.category).localeCompare(safeString(b.category), undefined, {
        sensitivity: "base",
      });
      if (byCategory !== 0) return byCategory;
      return safeString(a.title).localeCompare(safeString(b.title), undefined, { sensitivity: "base" });
    });
  }

  if (sortMode === "newest") {
    return arr.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  if (sortMode === "oldest") {
    return arr.sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  }

  return arr;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("General");
  const [docDescription, setDocDescription] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docSort, setDocSort] = useState("title-asc");
  const [docViewerUrl, setDocViewerUrl] = useState("");
  const [docViewerTitle, setDocViewerTitle] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [loading, setLoading] = useState(true);

  const [eventForm, setEventForm] = useState({
    id: null,
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    description: "",
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const groupedMembers = useMemo(() => {
    const groups = {
      Gents: [],
      Ladies: [],
      Associates: [],
    };

    members.forEach((member) => {
      const category = safeString(member.category).toLowerCase();
      if (category.includes("lad")) {
        groups.Ladies.push(member);
      } else if (category.includes("assoc")) {
        groups.Associates.push(member);
      } else {
        groups.Gents.push(member);
      }
    });

    return groups;
  }, [members]);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("date", { ascending: true, nullsFirst: false })
      .order("event_time", { ascending: true, nullsFirst: false })
      .order("time", { ascending: true, nullsFirst: false });

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
      const dateA = new Date(`${a.event_date || "9999-12-31"}T${a.event_time || "23:59"}`);
      const dateB = new Date(`${b.event_date || "9999-12-31"}T${b.event_time || "23:59"}`);
      return dateA.getTime() - dateB.getTime();
    });

    setEvents(cleaned);
  }

  async function fetchNotices() {
    const { data, error } = await supabase
      .from("information_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading notices:", error.message);
      return;
    }

    setNotices(data || []);
  }

  async function fetchMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error loading members:", error.message);
      return;
    }

    setMembers(data || []);
  }

  async function fetchOfficeBearers() {
    const { data, error } = await supabase
      .from("office_bearers")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading office bearers:", error.message);
      return;
    }

    setOfficeBearers(data || []);
  }

  async function fetchCoaches() {
    const { data, error } = await supabase
      .from("club_coaches")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading coaches:", error.message);
      return;
    }

    setCoaches(data || []);
  }

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading documents:", error.message);
      return;
    }

    const cleaned = (data || []).map((doc) => ({
      ...doc,
      file_url: doc.file_url || doc.url || "",
      category: doc.category || "General",
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
    setEventForm({
      id: null,
      title: "",
      event_date: "",
      event_time: "",
      location: "",
      description: "",
    });
  }

  function handleEditEvent(event) {
    setEventForm({
      id: event.id || null,
      title: safeString(event.title || event.name),
      event_date: safeString(event.event_date || event.date),
      event_time: safeString(event.event_time || event.time),
      location: safeString(event.location),
      description: safeString(event.description || event.details),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim()) {
      window.alert("Please enter an event title.");
      return;
    }

    if (!eventForm.event_date) {
      window.alert("Please enter an event date.");
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

      let response;
      if (eventForm.id) {
        response = await supabase.from("events").update(payload).eq("id", eventForm.id);
      } else {
        response = await supabase.from("events").insert([payload]);
      }

      if (response.error) {
        console.error(response.error);
        window.alert(`Could not save diary item: ${response.error.message}`);
        return;
      }

      await fetchEvents();
      resetEventForm();
      window.alert(eventForm.id ? "Diary item updated." : "Diary item added.");
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    const ok = window.confirm("Delete this diary item?");
    if (!ok) return;

    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      console.error(error);
      window.alert(`Could not delete diary item: ${error.message}`);
      return;
    }

    if (eventForm.id === eventId) {
      resetEventForm();
    }

    await fetchEvents();
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

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, docFile, { upsert: false });

      if (uploadError) {
        console.error(uploadError);
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
        console.error(insertError);
        window.alert(`Document record could not be saved: ${insertError.message}`);
        return;
      }

      setDocTitle("");
      setDocCategory("General");
      setDocDescription("");
      setDocFile(null);

      const fileInput = document.getElementById("document-upload-input");
      if (fileInput) fileInput.value = "";

      await fetchDocuments();
      window.alert("Document uploaded.");
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function handleDeleteDocument(doc) {
    const ok = window.confirm(`Delete \"${safeString(doc.title, "this document")}\"?`);
    if (!ok) return;

    try {
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
        console.error(error);
        window.alert(`Could not delete document: ${error.message}`);
        return;
      }

      if (docViewerUrl && (doc.file_url === docViewerUrl || doc.title === docViewerTitle)) {
        setDocViewerUrl("");
        setDocViewerTitle("");
      }

      await fetchDocuments();
    } catch (err) {
      console.error(err);
      window.alert("Delete failed.");
    }
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
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  function renderMemberCard(person, roleLabel) {
    const phone = person.phone || person.mobile || person.contact_number || "";
    const displayPhone = formatPhoneForDisplay(phone);
    const telPhone = cleanPhone(phone);
    const whatsappPhone = telPhone.startsWith("0") ? `44${telPhone.slice(1)}` : telPhone;

    return (
      <div key={`${roleLabel}-${person.id || person.name || person.full_name}`} style={styles.personCard}>
        <div>
          <div style={styles.personName}>{person.full_name || person.name || "Unnamed"}</div>
          {person.role ? <div style={styles.personRole}>{person.role}</div> : null}
          {person.email ? <div style={styles.personDetail}>{person.email}</div> : null}
          {displayPhone ? <div style={styles.personDetail}>{displayPhone}</div> : null}
        </div>

        {(telPhone || whatsappPhone) && (
          <div style={styles.personActions}>
            {telPhone ? (
              <a href={`tel:${telPhone}`} style={styles.actionLink}>
                Call
              </a>
            ) : null}
            {whatsappPhone ? (
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                style={styles.actionLinkSecondary}
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerTopRow}>
            <div style={styles.headerBrand}>
              <img src={logo} alt="Club Logo" style={styles.logo} />
              <div>
                <h1 style={styles.title}>{CLUB_NAME}</h1>
                <p style={styles.subtitle}>{CLUB_SUBTITLE}</p>
              </div>
            </div>

            <div style={styles.headerButtons}>
              {!isAdmin ? (
                <button style={styles.adminButton} onClick={handleAdminLogin} title="Admin login">
                  Admin
                </button>
              ) : (
                <button style={styles.adminButtonActive} onClick={handleAdminLogout}>
                  Admin On
                </button>
              )}
            </div>
          </div>

          <div style={styles.tabBar}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                style={activeTab === tab.key ? styles.activeTabButton : styles.tabButton}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div style={styles.loadingCard}>Loading…</div> : null}

        {!loading && activeTab === "home" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Welcome</h2>
            <div style={styles.homeGrid}>
              <div style={styles.infoTile}>
                <div style={styles.tileNumber}>{events.length}</div>
                <div style={styles.tileLabel}>Diary items</div>
              </div>
              <div style={styles.infoTile}>
                <div style={styles.tileNumber}>{notices.length}</div>
                <div style={styles.tileLabel}>Noticeboard posts</div>
              </div>
              <div style={styles.infoTile}>
                <div style={styles.tileNumber}>{members.length}</div>
                <div style={styles.tileLabel}>Members</div>
              </div>
              <div style={styles.infoTile}>
                <div style={styles.tileNumber}>{documents.length}</div>
                <div style={styles.tileLabel}>Documents</div>
              </div>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.subTitle}>Next Diary Items</h3>
              {events.length === 0 ? (
                <div style={styles.emptyMessage}>No diary items yet.</div>
              ) : (
                events.slice(0, 5).map((event) => (
                  <div key={event.id} style={styles.listCard}>
                    <div style={styles.listTitle}>{event.title || event.name || "Untitled event"}</div>
                    <div style={styles.listMeta}>
                      {formatDate(event.event_date || event.date)}
                      {(event.event_time || event.time) ? ` • ${formatTime(event.event_time || event.time)}` : ""}
                    </div>
                    {event.description ? <div style={styles.listBody}>{event.description}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === "diary" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Diary</h2>

            {isAdmin && (
              <div style={styles.adminCard}>
                <h3 style={styles.subTitle}>{eventForm.id ? "Edit Diary Item" : "Add Diary Item"}</h3>

                <input
                  type="text"
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  style={styles.input}
                />

                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, event_date: e.target.value }))}
                  style={styles.input}
                />

                <input
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, event_time: e.target.value }))}
                  style={styles.input}
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                  style={styles.input}
                />

                <textarea
                  placeholder="Description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  style={styles.textarea}
                  rows={4}
                />

                <div style={styles.formButtonRow}>
                  <button
                    style={isSavingEvent ? styles.primaryButtonDisabled : styles.primaryButton}
                    onClick={handleSaveEvent}
                    disabled={isSavingEvent}
                  >
                    {isSavingEvent ? "Saving..." : eventForm.id ? "Update Diary Item" : "Add Diary Item"}
                  </button>

                  <button type="button" style={styles.linkLikeButton} onClick={resetEventForm}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div style={styles.emptyMessage}>No diary items yet.</div>
            ) : (
              <div style={styles.stack}>
                {events.map((event) => (
                  <div key={event.id} style={styles.listCard}>
                    <div style={styles.listTitle}>{event.title || event.name || "Untitled event"}</div>
                    <div style={styles.listMeta}>
                      {formatDate(event.event_date || event.date)}
                      {(event.event_time || event.time) ? ` • ${formatTime(event.event_time || event.time)}` : ""}
                    </div>
                    {event.location ? <div style={styles.listBody}><strong>Location:</strong> {event.location}</div> : null}
                    {event.description ? <div style={styles.listBody}>{event.description}</div> : null}

                    {isAdmin ? (
                      <div style={styles.inlineActionRow}>
                        <button style={styles.secondaryButton} onClick={() => handleEditEvent(event)}>
                          Edit
                        </button>
                        <button style={styles.deleteButton} onClick={() => handleDeleteEvent(event.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "notices" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Noticeboard</h2>
            {notices.length === 0 ? (
              <div style={styles.emptyMessage}>No noticeboard posts yet.</div>
            ) : (
              <div style={styles.stack}>
                {notices.map((notice) => (
                  <div key={notice.id} style={styles.listCard}>
                    <div style={styles.listTitle}>{notice.title || "Notice"}</div>
                    {notice.created_at ? (
                      <div style={styles.listMeta}>{formatDate(notice.created_at)}</div>
                    ) : null}
                    {notice.description ? <div style={styles.listBody}>{notice.description}</div> : null}
                    {notice.content ? <div style={styles.listBody}>{notice.content}</div> : null}
                    {notice.url ? (
                      <a href={notice.url} target="_blank" rel="noreferrer" style={styles.inlineLink}>
                        Open link
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "members" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Members</h2>

            <div style={styles.panel}>
              <h3 style={styles.subTitle}>Gents</h3>
              {groupedMembers.Gents.length === 0 ? (
                <div style={styles.emptyMessage}>No gents members found.</div>
              ) : (
                <div style={styles.peopleGrid}>
                  {groupedMembers.Gents.map((member) => renderMemberCard(member, "gent"))}
                </div>
              )}
            </div>

            <div style={styles.panel}>
              <h3 style={styles.subTitle}>Ladies</h3>
              {groupedMembers.Ladies.length === 0 ? (
                <div style={styles.emptyMessage}>No ladies members found.</div>
              ) : (
                <div style={styles.peopleGrid}>
                  {groupedMembers.Ladies.map((member) => renderMemberCard(member, "lady"))}
                </div>
              )}
            </div>

            <div style={styles.panel}>
              <h3 style={styles.subTitle}>Associates</h3>
              {groupedMembers.Associates.length === 0 ? (
                <div style={styles.emptyMessage}>No associate members found.</div>
              ) : (
                <div style={styles.peopleGrid}>
                  {groupedMembers.Associates.map((member) => renderMemberCard(member, "associate"))}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === "office" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Office Bearers</h2>
            {officeBearers.length === 0 ? (
              <div style={styles.emptyMessage}>No office bearers added yet.</div>
            ) : (
              <div style={styles.peopleGrid}>
                {officeBearers.map((person) => renderMemberCard(person, "office"))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "coaches" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Club Coaches</h2>
            {coaches.length === 0 ? (
              <div style={styles.emptyMessage}>No coaches added yet.</div>
            ) : (
              <div style={styles.peopleGrid}>
                {coaches.map((person) => renderMemberCard(person, "coach"))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "documents" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Documents</h2>

            {isAdmin && (
              <div style={styles.adminCard}>
                <h3 style={styles.subTitle}>Upload Document</h3>

                <input
                  type="text"
                  placeholder="Enter document title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={styles.input}
                />

                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  style={styles.input}
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Optional short description"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  style={styles.textarea}
                  rows={3}
                />

                <input
                  id="document-upload-input"
                  type="file"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  style={styles.fileInput}
                />

                <button
                  style={isUploadingDoc ? styles.primaryButtonDisabled : styles.primaryButton}
                  onClick={handleDocumentUpload}
                  disabled={isUploadingDoc}
                >
                  {isUploadingDoc ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            )}

            <div style={styles.documentsToolbar}>
              <div style={styles.documentsToolbarLeft}>
                <strong style={styles.sortLabel}>Sort:</strong>
                <select
                  value={docSort}
                  onChange={(e) => setDocSort(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                  <option value="category-asc">Category</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {documents.length === 0 ? (
              <div style={styles.emptyMessage}>No documents uploaded yet.</div>
            ) : (
              <div style={styles.documentsList}>
                {documents.map((doc) => (
                  <div key={doc.id} style={styles.documentItem}>
                    <div style={styles.documentInfo}>
                      <div style={styles.documentTitleRow}>
                        <span style={styles.documentTitle}>{doc.title || "Untitled document"}</span>
                        <span style={styles.documentCategory}>{doc.category || "General"}</span>
                      </div>

                      {doc.description ? <div style={styles.documentMeta}>{doc.description}</div> : null}
                      {doc.file_name ? <div style={styles.documentMeta}>{doc.file_name}</div> : null}
                      {doc.created_at ? (
                        <div style={styles.documentMetaSmall}>Added {formatDate(doc.created_at)}</div>
                      ) : null}
                    </div>

                    <div style={styles.documentActions}>
                      <button style={styles.secondaryButton} onClick={() => handleOpenDocument(doc)}>
                        Open
                      </button>

                      {(doc.file_url || doc.url) ? (
                        <a
                          href={doc.file_url || doc.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.linkButton}
                        >
                          New Tab
                        </a>
                      ) : null}

                      {isAdmin ? (
                        <button style={styles.deleteButton} onClick={() => handleDeleteDocument(doc)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {docViewerUrl ? (
              <div style={styles.viewerCard}>
                <div style={styles.viewerHeader}>
                  <h3 style={styles.viewerTitle}>{docViewerTitle}</h3>
                  <button
                    style={styles.deleteButton}
                    onClick={() => {
                      setDocViewerUrl("");
                      setDocViewerTitle("");
                    }}
                  >
                    Close
                  </button>
                </div>

                <iframe
                  src={docViewerUrl}
                  title={docViewerTitle || "Document viewer"}
                  style={styles.viewerFrame}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #7f112f 0%, #8f1736 35%, #a11f44 100%)",
    padding: 18,
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  header: {
    background: "rgba(255,255,255,0.10)",
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
    backdropFilter: "blur(4px)",
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  logo: {
    width: 92,
    height: 92,
    objectFit: "contain",
    borderRadius: 18,
    background: "rgba(255,255,255,0.95)",
    padding: 8,
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "2.3rem",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#f9e9ef",
    fontSize: "1.08rem",
    fontWeight: 600,
  },
  headerButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  adminButton: {
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  adminButtonActive: {
    background: "#ffffff",
    color: "#8b1e3f",
    border: "1px solid #ffffff",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  tabBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  tabButton: {
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
  },
  activeTabButton: {
    background: "#ffffff",
    color: "#8b1e3f",
    border: "1px solid #ffffff",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "pointer",
  },
  loadingCard: {
    background: "#f4eff2",
    borderRadius: 24,
    padding: 24,
    color: "#8b1e3f",
    fontSize: "1.2rem",
    fontWeight: 700,
  },
  sectionCard: {
    background: "#f4eff2",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
  },
  sectionTitle: {
    margin: "0 0 18px 0",
    color: "#8b1e3f",
    fontSize: "2rem",
    fontWeight: 800,
  },
  subTitle: {
    margin: "0 0 14px 0",
    color: "#8b1e3f",
    fontSize: "1.35rem",
    fontWeight: 800,
  },
  homeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  infoTile: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #e1d3d8",
  },
  tileNumber: {
    color: "#8b1e3f",
    fontSize: "2rem",
    fontWeight: 800,
    marginBottom: 6,
  },
  tileLabel: {
    color: "#6d4956",
    fontSize: "1rem",
    fontWeight: 700,
  },
  panel: {
    background: "#efe5ea",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  listCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    border: "1px solid #e1d3d8",
  },
  listTitle: {
    color: "#8b1e3f",
    fontSize: "1.15rem",
    fontWeight: 800,
    marginBottom: 6,
  },
  listMeta: {
    color: "#6d4956",
    fontSize: "0.96rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  listBody: {
    color: "#412a33",
    fontSize: "1rem",
    lineHeight: 1.5,
    marginTop: 6,
    whiteSpace: "pre-wrap",
  },
  inlineLink: {
    display: "inline-block",
    marginTop: 10,
    color: "#8b1e3f",
    fontWeight: 800,
    textDecoration: "none",
  },
  peopleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: 14,
  },
  personCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    border: "1px solid #e1d3d8",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  personName: {
    color: "#8b1e3f",
    fontSize: "1.08rem",
    fontWeight: 800,
    marginBottom: 6,
  },
  personRole: {
    color: "#6d4956",
    fontWeight: 700,
    marginBottom: 6,
  },
  personDetail: {
    color: "#412a33",
    fontSize: "0.98rem",
    marginBottom: 4,
  },
  personActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  actionLink: {
    background: "#8b1e3f",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  actionLinkSecondary: {
    background: "#ffffff",
    color: "#8b1e3f",
    textDecoration: "none",
    border: "2px solid #8b1e3f",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  adminCard: {
    background: "#efe5ea",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d2c5cb",
    marginBottom: 12,
    fontSize: "1rem",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d2c5cb",
    marginBottom: 12,
    fontSize: "1rem",
    background: "#fff",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d2c5cb",
    marginBottom: 12,
    fontSize: "1rem",
    background: "#fff",
  },
  primaryButton: {
    background: "#8b1e3f",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "pointer",
  },
  primaryButtonDisabled: {
    background: "#b88a98",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "not-allowed",
  },
  secondaryButton: {
    background: "#8b1e3f",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  deleteButton: {
    background: "#d9044b",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  linkButton: {
    display: "inline-block",
    background: "#ffffff",
    color: "#8b1e3f",
    border: "2px solid #8b1e3f",
    borderRadius: 12,
    padding: "8px 14px",
    fontWeight: 800,
    fontSize: "0.95rem",
    textDecoration: "none",
  },
  documentsToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  documentsToolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  sortLabel: {
    color: "#6f2237",
    fontSize: "1rem",
  },
  sortSelect: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d2c5cb",
    fontSize: "0.95rem",
    background: "#fff",
  },
  documentsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  documentItem: {
    background: "#f7f3f5",
    border: "1px solid #dfd2d8",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  documentInfo: {
    flex: 1,
    minWidth: 240,
  },
  documentTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  documentTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#8b1e3f",
  },
  documentCategory: {
    background: "#8b1e3f",
    color: "#fff",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  documentMeta: {
    color: "#6b5a61",
    fontSize: "0.95rem",
    marginTop: 4,
  },
  documentMetaSmall: {
    color: "#8b7680",
    fontSize: "0.85rem",
    marginTop: 4,
  },
  documentActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  viewerCard: {
    marginTop: 22,
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid #dfd2d8",
  },
  viewerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  viewerTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#8b1e3f",
    margin: 0,
  },
  viewerFrame: {
    width: "100%",
    height: "700px",
    border: "none",
    borderRadius: 12,
    background: "#f5f5f5",
  },
  emptyMessage: {
    padding: 18,
    borderRadius: 14,
    background: "#f7f3f5",
    color: "#6f2237",
    fontWeight: 700,
  },
  formButtonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  linkLikeButton: {
    background: "#ffffff",
    color: "#8b1e3f",
    border: "2px solid #8b1e3f",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  inlineActionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
};
