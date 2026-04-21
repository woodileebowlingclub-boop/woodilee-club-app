import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const ADMIN_PIN = "1954";

const TABS = [
  { key: "home", label: "Home" },
  { key: "diary", label: "Diary" },
  { key: "notices", label: "Notices" },
  { key: "members", label: "Members" },
  { key: "office", label: "Office Bearers" },
  { key: "coaches", label: "Club Coaches" },
  { key: "documents", label: "Documents" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function getField(item, keys, fallback = "") {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }
  return fallback;
}

function parseDateTextToDate(text) {
  if (!text) return null;
  const clean = String(text).trim();
  if (!clean) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const d = new Date(`${clean}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const direct = new Date(clean);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (match) {
    const [, day, monthName, year] = match;
    const parsed = new Date(`${day} ${monthName} ${year} 12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function parseEventDate(event) {
  const eventDate = safeString(event?.event_date).trim();
  if (eventDate) {
    const parsed = parseDateTextToDate(eventDate);
    if (parsed) return parsed;
  }

  const dateText = safeString(event?.date_text).trim();
  if (dateText) {
    const parsed = parseDateTextToDate(dateText);
    if (parsed) return parsed;
  }

  return null;
}

function formatDateForDisplay(dateObj) {
  if (!dateObj) return "";
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayEventDate(event) {
  const dateText = safeString(event?.date_text).trim();
  if (dateText) {
    const parsed = parseDateTextToDate(dateText);
    return parsed ? formatDateForDisplay(parsed) : dateText;
  }

  const parsed = parseEventDate(event);
  if (!parsed) return "";
  return formatDateForDisplay(parsed);
}

function normalisePhone(phone) {
  const raw = safeString(phone).trim();
  if (!raw) return "";
  return raw.replace(/[^\d+]/g, "");
}

function toWhatsAppLink(phone) {
  const cleaned = normalisePhone(phone);
  if (!cleaned) return "";

  let digits = cleaned;
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("0")) {
    digits = `44${digits.slice(1)}`;
  }

  digits = digits.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function toTelLink(phone) {
  const cleaned = normalisePhone(phone);
  if (!cleaned) return "";
  return `tel:${cleaned}`;
}

function ActionLinks({ phone }) {
  const tel = toTelLink(phone);
  const whatsapp = toWhatsAppLink(phone);

  if (!tel && !whatsapp) return null;

  return (
    <div style={styles.actionRow}>
      {tel && (
        <a href={tel} style={styles.actionLink}>
          Call
        </a>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noreferrer" style={styles.actionLink}>
          WhatsApp
        </a>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [memberSearch, setMemberSearch] = useState("");

  const [noticeForm, setNoticeForm] = useState({ title: "", content: "" });
  const [eventForm, setEventForm] = useState({
    title: "",
    date_text: "",
    event_date: "",
    event_time: "",
    note: "",
  });
  const [memberForm, setMemberForm] = useState({
    name: "",
    section: "Gents",
    phone: "",
  });
  const [officeForm, setOfficeForm] = useState({
    role: "",
    name: "",
    phone: "",
    display_order: "",
  });
  const [coachForm, setCoachForm] = useState({ name: "", phone: "" });
  const [documentForm, setDocumentForm] = useState({
    title: "",
    file_url: "",
    description: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setErrorMessage("");

    const [eventsRes, noticesRes, membersRes, officeRes, coachesRes, docsRes] = await Promise.all([
      supabase.from("events").select("*"),
      supabase.from("information_posts").select("*"),
      supabase.from("members").select("*"),
      supabase.from("office_bearers").select("*"),
      supabase.from("club_coaches").select("*"),
      supabase.from("documents").select("*"),
    ]);

    const errors = [
      eventsRes.error,
      noticesRes.error,
      membersRes.error,
      officeRes.error,
      coachesRes.error,
      docsRes.error,
    ]
      .filter(Boolean)
      .map((e) => e.message);

    if (errors.length > 0) setErrorMessage(errors[0]);

    setEvents(eventsRes.data || []);
    setNotices(noticesRes.data || []);
    setMembers(membersRes.data || []);
    setOfficeBearers(officeRes.data || []);
    setCoaches(coachesRes.data || []);
    setDocuments(docsRes.data || []);
    setLoading(false);
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function showSaved(message) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  }

  function openAdminPrompt() {
    setShowAdminPrompt(true);
    setAdminPinInput("");
  }

  function closeAdminPrompt() {
    setShowAdminPrompt(false);
    setAdminPinInput("");
  }

  function submitAdminPin() {
    if (adminPinInput === ADMIN_PIN) {
      setAdminMode(true);
      setShowAdminPrompt(false);
      setAdminPinInput("");
      clearMessages();
      return;
    }
    alert("Incorrect admin PIN");
  }

  function logoutAdmin() {
    setAdminMode(false);
    setActiveTab("home");
  }

  async function addNotice() {
    const title = noticeForm.title.trim();
    const content = noticeForm.content.trim();
    if (!title || !content) {
      alert("Enter notice title and content");
      return;
    }

    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("information_posts").insert({ title, content });
    if (error) {
      setErrorMessage(error.message || "Failed to add notice");
      setSaving(false);
      return;
    }

    setNoticeForm({ title: "", content: "" });
    await loadAll();
    setSaving(false);
    showSaved("Notice added");
  }

  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("information_posts").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete notice");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Notice deleted");
  }

  async function addEvent() {
    const title = eventForm.title.trim();
    const dateText = eventForm.date_text.trim();
    const eventDate = eventForm.event_date.trim();
    const eventTime = eventForm.event_time.trim();
    const note = eventForm.note.trim();

    if (!title) {
      alert("Enter event title");
      return;
    }

    setSaving(true);
    clearMessages();

    const payload = {
      title,
      date_text: dateText || null,
      event_date: eventDate || null,
      event_time: eventTime || null,
      note: note || null,
      notes: note || null,
      content: note || null,
    };

    const { error } = await supabase.from("events").insert(payload);
    if (error) {
      setErrorMessage(error.message || "Failed to add diary entry");
      setSaving(false);
      return;
    }

    setEventForm({
      title: "",
      date_text: "",
      event_date: "",
      event_time: "",
      note: "",
    });

    await loadAll();
    setSaving(false);
    showSaved("Diary entry added");
  }

  async function deleteEvent(id) {
    if (!window.confirm("Delete this diary entry?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete diary entry");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Diary entry deleted");
  }

  async function addMember() {
    const name = memberForm.name.trim();
    if (!name) {
      alert("Enter member name");
      return;
    }

    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("members").insert({
      name,
      section: memberForm.section,
      phone: memberForm.phone.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add member");
      setSaving(false);
      return;
    }

    setMemberForm({ name: "", section: "Gents", phone: "" });
    await loadAll();
    setSaving(false);
    showSaved("Member added");
  }

  async function deleteMember(id) {
    if (!window.confirm("Delete this member?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete member");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Member deleted");
  }

  async function addOfficeBearer() {
    const role = officeForm.role.trim();
    const name = officeForm.name.trim();
    if (!role || !name) {
      alert("Enter role and name");
      return;
    }

    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("office_bearers").insert({
      role,
      name,
      phone: officeForm.phone.trim() || null,
      display_order: officeForm.display_order ? Number(officeForm.display_order) : null,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add office bearer");
      setSaving(false);
      return;
    }

    setOfficeForm({ role: "", name: "", phone: "", display_order: "" });
    await loadAll();
    setSaving(false);
    showSaved("Office bearer added");
  }

  async function deleteOfficeBearer(id) {
    if (!window.confirm("Delete this office bearer?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete office bearer");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Office bearer deleted");
  }

  async function addCoach() {
    const name = coachForm.name.trim();
    if (!name) {
      alert("Enter coach name");
      return;
    }

    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("club_coaches").insert({
      name,
      phone: coachForm.phone.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add coach");
      setSaving(false);
      return;
    }

    setCoachForm({ name: "", phone: "" });
    await loadAll();
    setSaving(false);
    showSaved("Coach added");
  }

  async function deleteCoach(id) {
    if (!window.confirm("Delete this coach?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("club_coaches").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete coach");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Coach deleted");
  }

  async function addDocument() {
    const title = documentForm.title.trim();
    if (!title) {
      alert("Enter document title");
      return;
    }

    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("documents").insert({
      title,
      file_url: documentForm.file_url.trim() || null,
      description: documentForm.description.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add document");
      setSaving(false);
      return;
    }

    setDocumentForm({ title: "", file_url: "", description: "" });
    await loadAll();
    setSaving(false);
    showSaved("Document added");
  }

  async function deleteDocument(id) {
    if (!window.confirm("Delete this document?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      setErrorMessage(error.message || "Failed to delete document");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Document deleted");
  }

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = parseEventDate(a);
      const db = parseEventDate(b);

      if (!da && !db) {
        return safeString(getField(a, ["title"], "")).localeCompare(
          safeString(getField(b, ["title"], ""))
        );
      }
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }, [events]);

  const upcomingEvents = useMemo(() => sortedEvents.slice(0, 6), [sortedEvents]);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      const aDate = getField(a, ["created_at"], "");
      const bDate = getField(b, ["created_at"], "");
      return String(bDate).localeCompare(String(aDate));
    });
  }, [notices]);

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return members;

    return members.filter((m) => {
      const name = safeString(getField(m, ["name"], "")).toLowerCase();
      const section = safeString(getField(m, ["section"], "")).toLowerCase();
      const phone = safeString(getField(m, ["phone"], "")).toLowerCase();
      return name.includes(search) || section.includes(search) || phone.includes(search);
    });
  }, [members, memberSearch]);

  const groupedMembers = useMemo(() => {
    const groups = { Gents: [], Ladies: [], Associate: [], Other: [] };

    filteredMembers.forEach((member) => {
      const section = safeString(getField(member, ["section"], "Other"));
      if (groups[section]) groups[section].push(member);
      else groups.Other.push(member);
    });

    return groups;
  }, [filteredMembers]);

  const sortedOfficeBearers = useMemo(() => {
    return [...officeBearers].sort((a, b) => {
      const aOrder = Number(getField(a, ["display_order"], 9999));
      const bOrder = Number(getField(b, ["display_order"], 9999));
      if (aOrder !== bOrder) return aOrder - bOrder;
      return safeString(getField(a, ["role"], "")).localeCompare(
        safeString(getField(b, ["role"], ""))
      );
    });
  }, [officeBearers]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerCard}>
          <div style={styles.headerTopRow}>
            <div>
              <h1 style={styles.title}>Woodilee Bowling Club</h1>
              <p style={styles.subtitle}>Members diary, notices and club information</p>
            </div>

            <div style={styles.adminControls}>
              {!adminMode ? (
                <button style={styles.secondaryButton} onClick={openAdminPrompt}>
                  Admin
                </button>
              ) : (
                <button style={styles.secondaryButton} onClick={logoutAdmin}>
                  Admin Logout
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={activeTab === tab.key ? styles.activeTab : styles.tab}
            >
              {tab.label}
            </button>
          ))}
          {adminMode && (
            <button
              onClick={() => setActiveTab("admin")}
              style={activeTab === "admin" ? styles.activeTab : styles.tab}
            >
              Admin
            </button>
          )}
        </div>

        {loading && <div style={styles.messageCard}>Loading…</div>}
        {errorMessage && <div style={styles.errorCard}>{errorMessage}</div>}
        {successMessage && <div style={styles.successCard}>{successMessage}</div>}

        {showAdminPrompt && (
          <div style={styles.modalOverlay} onClick={closeAdminPrompt}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.sectionTitle}>Admin Login</h3>
              <input
                type="password"
                placeholder="Enter admin PIN"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                style={styles.input}
              />
              <div style={styles.modalButtonRow}>
                <button style={styles.button} onClick={submitAdminPin}>
                  Login
                </button>
                <button style={styles.secondaryButton} onClick={closeAdminPrompt}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "home" && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Welcome</h3>
              <p style={styles.paragraph}>
                Welcome to the club app. Use the sections above for diary dates,
                notices, members, office bearers, coaches and documents.
              </p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p style={styles.paragraph}>No upcoming events yet.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{getField(event, ["title"], "Untitled event")}</div>
                    {!!displayEventDate(event) && (
                      <div style={styles.listMeta}>{displayEventDate(event)}</div>
                    )}
                    {getField(event, ["event_time"], "") && (
                      <div style={styles.listMeta}>{getField(event, ["event_time"], "")}</div>
                    )}
                    {getField(event, ["note", "notes", "content"], "") && (
                      <div style={styles.paragraph}>{getField(event, ["note", "notes", "content"], "")}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Latest Notices</h3>
              {sortedNotices.length === 0 ? (
                <p style={styles.paragraph}>No notices yet.</p>
              ) : (
                sortedNotices.slice(0, 5).map((notice) => (
                  <div key={notice.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{getField(notice, ["title"], "Notice")}</div>
                    <div style={styles.paragraph}>{getField(notice, ["content"], "")}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "diary" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Diary</h3>
            {sortedEvents.length === 0 ? (
              <p style={styles.paragraph}>No diary entries yet.</p>
            ) : (
              sortedEvents.map((event) => (
                <div key={event.id} style={styles.listItem}>
                  <div style={styles.listTitle}>{getField(event, ["title"], "Untitled event")}</div>
                  {!!displayEventDate(event) && (
                    <div style={styles.listMeta}>{displayEventDate(event)}</div>
                  )}
                  {getField(event, ["event_time"], "") && (
                    <div style={styles.listMeta}>{getField(event, ["event_time"], "")}</div>
                  )}
                  {getField(event, ["note", "notes", "content"], "") && (
                    <div style={styles.paragraph}>{getField(event, ["note", "notes", "content"], "")}</div>
                  )}
                  {adminMode && (
                    <button style={styles.deleteButton} onClick={() => deleteEvent(event.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notices" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Notices</h3>
            {sortedNotices.length === 0 ? (
              <p style={styles.paragraph}>No notices yet.</p>
            ) : (
              sortedNotices.map((notice) => (
                <div key={notice.id} style={styles.listItem}>
                  <div style={styles.listTitle}>{getField(notice, ["title"], "Notice")}</div>
                  <div style={styles.paragraph}>{getField(notice, ["content"], "")}</div>
                  {adminMode && (
                    <button style={styles.deleteButton} onClick={() => deleteNotice(notice.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Members</h3>
            <input
              type="text"
              placeholder="Search members"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ ...styles.input, marginBottom: 16, maxWidth: 360 }}
            />

            {Object.entries(groupedMembers).map(([groupName, groupItems]) => (
              <div key={groupName} style={{ marginBottom: 22 }}>
                <h4 style={styles.subHeading}>{groupName}</h4>
                {groupItems.length === 0 ? (
                  <div style={styles.paragraph}>No members in this section.</div>
                ) : (
                  groupItems.map((member) => (
                    <div key={member.id} style={styles.listItem}>
                      <div style={styles.listTitle}>{getField(member, ["name"], "Unnamed member")}</div>
                      {getField(member, ["phone"]) && (
                        <div style={styles.listMeta}>Phone: {getField(member, ["phone"])}</div>
                      )}
                      <ActionLinks phone={getField(member, ["phone"], "")} />
                      {adminMode && (
                        <button style={styles.deleteButton} onClick={() => deleteMember(member.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "office" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Office Bearers</h3>
            {sortedOfficeBearers.length === 0 ? (
              <p style={styles.paragraph}>No office bearers entered yet.</p>
            ) : (
              sortedOfficeBearers.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <div style={styles.listTitle}>{getField(item, ["role"], "Role")}</div>
                  <div style={styles.listMeta}>{getField(item, ["name"], "")}</div>
                  {getField(item, ["phone"]) && (
                    <div style={styles.listMeta}>Phone: {getField(item, ["phone"])}</div>
                  )}
                  <ActionLinks phone={getField(item, ["phone"], "")} />
                  {adminMode && (
                    <button style={styles.deleteButton} onClick={() => deleteOfficeBearer(item.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "coaches" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Club Coaches</h3>
            {coaches.length === 0 ? (
              <p style={styles.paragraph}>No coaches entered yet.</p>
            ) : (
              coaches.map((coach) => (
                <div key={coach.id} style={styles.listItem}>
                  <div style={styles.listTitle}>{getField(coach, ["name"], "")}</div>
                  {getField(coach, ["phone"]) && (
                    <div style={styles.listMeta}>Phone: {getField(coach, ["phone"])}</div>
                  )}
                  <ActionLinks phone={getField(coach, ["phone"], "")} />
                  {adminMode && (
                    <button style={styles.deleteButton} onClick={() => deleteCoach(coach.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Documents</h3>
            {documents.length === 0 ? (
              <p style={styles.paragraph}>No documents yet.</p>
            ) : (
              documents.map((doc) => {
                const url = getField(doc, ["file_url", "url", "link"], "");
                return (
                  <div key={doc.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{getField(doc, ["title"], "Document")}</div>
                    {getField(doc, ["description"], "") && (
                      <div style={styles.paragraph}>{getField(doc, ["description"], "")}</div>
                    )}
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" style={styles.link}>
                        Open document
                      </a>
                    ) : (
                      <div style={styles.listMeta}>No link added</div>
                    )}
                    {adminMode && (
                      <button style={styles.deleteButton} onClick={() => deleteDocument(doc.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {adminMode && activeTab === "admin" && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Notice</h3>
              <input
                type="text"
                placeholder="Notice title"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Notice content"
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                style={styles.textarea}
              />
              <button style={styles.button} onClick={addNotice} disabled={saving}>
                Save Notice
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Diary Entry</h3>
              <input
                type="text"
                placeholder="Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Display date e.g. 29 Aug 2026"
                value={eventForm.date_text}
                onChange={(e) => setEventForm({ ...eventForm, date_text: e.target.value })}
                style={styles.input}
              />
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                style={styles.input}
              />
              <input
                type="time"
                value={eventForm.event_time}
                onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Note"
                value={eventForm.note}
                onChange={(e) => setEventForm({ ...eventForm, note: e.target.value })}
                style={styles.textarea}
              />
              <button style={styles.button} onClick={addEvent} disabled={saving}>
                Save Diary Entry
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Member</h3>
              <input
                type="text"
                placeholder="Name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                style={styles.input}
              />
              <select
                value={memberForm.section}
                onChange={(e) => setMemberForm({ ...memberForm, section: e.target.value })}
                style={styles.input}
              >
                <option>Gents</option>
                <option>Ladies</option>
                <option>Associate</option>
              </select>
              <input
                type="text"
                placeholder="Phone"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                style={styles.input}
              />
              <button style={styles.button} onClick={addMember} disabled={saving}>
                Save Member
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Office Bearer</h3>
              <input
                type="text"
                placeholder="Role"
                value={officeForm.role}
                onChange={(e) => setOfficeForm({ ...officeForm, role: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Name"
                value={officeForm.name}
                onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={officeForm.phone}
                onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Display order"
                value={officeForm.display_order}
                onChange={(e) => setOfficeForm({ ...officeForm, display_order: e.target.value })}
                style={styles.input}
              />
              <button style={styles.button} onClick={addOfficeBearer} disabled={saving}>
                Save Office Bearer
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Coach</h3>
              <input
                type="text"
                placeholder="Coach name"
                value={coachForm.name}
                onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={coachForm.phone}
                onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })}
                style={styles.input}
              />
              <button style={styles.button} onClick={addCoach} disabled={saving}>
                Save Coach
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Document</h3>
              <input
                type="text"
                placeholder="Title"
                value={documentForm.title}
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Document link"
                value={documentForm.file_url}
                onChange={(e) => setDocumentForm({ ...documentForm, file_url: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Description"
                value={documentForm.description}
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                style={styles.textarea}
              />
              <button style={styles.button} onClick={addDocument} disabled={saving}>
                Save Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #6f1f32 0%, #8d3045 55%, #a84758 100%)",
    padding: 12,
    fontFamily: "Arial, sans-serif",
    color: "#222",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  headerCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    marginBottom: 14,
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  adminControls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "clamp(28px, 5vw, 46px)",
    color: "#7a2638",
    lineHeight: 1.08,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#444",
    fontSize: "clamp(16px, 2.8vw, 22px)",
  },
  tabBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  tab: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#f1d8de",
    color: "#5b1d2a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  activeTab: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 16,
    fontSize: "clamp(24px, 4vw, 32px)",
    color: "#7a2638",
  },
  subHeading: {
    marginTop: 0,
    marginBottom: 10,
    color: "#5b1d2a",
    fontSize: 20,
  },
  paragraph: {
    color: "#444",
    lineHeight: 1.45,
    marginTop: 6,
    marginBottom: 6,
    fontSize: 16,
  },
  listItem: {
    border: "1px solid #e5d7db",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    background: "#fffafc",
  },
  listTitle: {
    fontWeight: 700,
    color: "#5b1d2a",
    marginBottom: 6,
    fontSize: "clamp(18px, 3vw, 22px)",
    lineHeight: 1.25,
  },
  listMeta: {
    color: "#555",
    fontSize: 16,
    marginBottom: 6,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 8,
  },
  actionLink: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#e9f6ec",
    color: "#1f6b2d",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 15,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 16,
    marginBottom: 10,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 16,
    marginBottom: 10,
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  button: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
  },
  secondaryButton: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "#555",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#b00020",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
  },
  link: {
    color: "#7a2638",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
    marginTop: 6,
    fontSize: 16,
  },
  messageCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    color: "#333",
    fontWeight: 700,
  },
  errorCard: {
    background: "#fff1f2",
    border: "1px solid #f0c5cb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: "#b00020",
    fontWeight: 700,
  },
  successCard: {
    background: "#f2fbf4",
    border: "1px solid #cbe8d0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    color: "#1f6b2d",
    fontWeight: 700,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    background: "#fff",
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  modalButtonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
};  just use this full script and anything else needed to get it working !!!!!! ps name of code file and where to paste it don't assume i know any of that  go!!!!!!! just do it for canvas then tell me exactly what to do next layman  make sure the hidden admin thing is not on the top page visible to others don't just give me code get it working!!!!!!!!!  sorry if i'm being snippy i just want it working  understandably frustrated though  give me layman exact steps and no canvas bullshit if its not working not mutch point  fix it! please no module issues i'm just looking for one clean final answer where to paste everything!!!!!! don't stop mid way if there are 2 or 3 files i need them all in full now and exact where they go and what to name them  go now!!!!!!!!!!!! apologies again though  make sure the code is clean and won't fail build this time and nothing missing  also tell me how i get from github to vercel live after pasting for idiots please i want it working without you missing bits again please think it through  also tell me if i need any database columns changed for the added office bearer phone and coaches phone to work properly so i don't get another error  just give final proper answer now  analyse it properly don't rush it wrong again please think through everything carefully before answering  use current information of what has happened so far don't ignore it  think!!!!!!! use the proper tools available  i want one complete answer not drip fed bits  also if there is anything from your earlier code that causes build problems remove it now  not later  go!!  please and thanks  use your brain and tools properly now this has gone on too long!!!!!նական to=canmore.update_textdoc ＿色: 429 Too Many Requests for url: https://canmore-workers.chatgpt.com/v1/textdocs/683398efd19881918f524c8c270dbbbd.update ಹೇಳಿದ್ದಾರೆ analysis to=personal_context.search  大发游戏  大发快三是不是  天天中彩票无法க்கு  重庆时时彩杀ಾಯ{
