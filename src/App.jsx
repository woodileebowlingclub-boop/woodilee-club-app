import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const MEMBER_PIN = "1911";
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

function parseDateValue(value) {
  if (!value) return null;
  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const d = new Date(`${text}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = text.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (parts) {
    const [, day, monthText, year] = parts;
    const d = new Date(`${day} ${monthText} ${year} 12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const parsed = parseDateValue(value);
  if (!parsed) return String(value);

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normaliseTime(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text.slice(0, 5);
  return text;
}

function getEventDisplayDate(event) {
  const eventDate = getField(event, ["event_date"], "");
  const dateText = getField(event, ["date_text"], "");
  return formatDisplayDate(eventDate || dateText);
}

function getEventSortValue(event) {
  const eventDate = getField(event, ["event_date"], "");
  const dateText = getField(event, ["date_text"], "");
  const raw = eventDate || dateText;
  const parsed = parseDateValue(raw);
  return parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER;
}

export default function App() {
  const [pinInput, setPinInput] = useState("");
  const [accessMode, setAccessMode] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [memberSearch, setMemberSearch] = useState("");

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
  });

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
    display_order: "",
  });

  const [coachForm, setCoachForm] = useState({
    name: "",
  });

  const [documentForm, setDocumentForm] = useState({
    title: "",
    file_url: "",
    description: "",
  });

  const isLoggedIn = accessMode === "member" || accessMode === "admin";
  const isAdmin = accessMode === "admin";

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setErrorMessage("");

    const [
      eventsRes,
      noticesRes,
      membersRes,
      officeRes,
      coachesRes,
      docsRes,
    ] = await Promise.all([
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

  function handleLogin(type) {
    if (type === "member") {
      if (pinInput === MEMBER_PIN) {
        setAccessMode("member");
        setPinInput("");
        clearMessages();
        return;
      }
      alert("Incorrect member PIN");
      return;
    }

    if (type === "admin") {
      if (pinInput === ADMIN_PIN) {
        setAccessMode("admin");
        setPinInput("");
        clearMessages();
        return;
      }
      alert("Incorrect admin PIN");
    }
  }

  function handleLogout() {
    setAccessMode(null);
    setPinInput("");
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

    const { error } = await supabase.from("information_posts").insert({
      title,
      content,
    });

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
      date_text: dateText || (eventDate ? formatDisplayDate(eventDate) : null),
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

    setMemberForm({
      name: "",
      section: "Gents",
      phone: "",
    });

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
      display_order: officeForm.display_order ? Number(officeForm.display_order) : null,
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add office bearer");
      setSaving(false);
      return;
    }

    setOfficeForm({
      role: "",
      name: "",
      display_order: "",
    });

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
    });

    if (error) {
      setErrorMessage(error.message || "Failed to add coach");
      setSaving(false);
      return;
    }

    setCoachForm({ name: "" });
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

    setDocumentForm({
      title: "",
      file_url: "",
      description: "",
    });

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
    return [...events].sort((a, b) => getEventSortValue(a) - getEventSortValue(b));
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return sortedEvents.slice(0, 6);
  }, [sortedEvents]);

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
    const groups = {
      Gents: [],
      Ladies: [],
      Associate: [],
      Other: [],
    };

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

  function renderEventCard(event, showDelete = false) {
    const title = getField(event, ["title"], "Untitled event");
    const date = getEventDisplayDate(event);
    const time = normaliseTime(getField(event, ["event_time"], ""));
    const note = getField(event, ["note", "notes", "content"], "");

    return (
      <div key={event.id} style={styles.listItem}>
        <div style={styles.listTitle}>{title}</div>
        {(date || time) && (
          <div style={styles.listMeta}>
            {date}
            {date && time ? " • " : ""}
            {time}
          </div>
        )}
        {note && <div style={styles.paragraph}>{note}</div>}
        {showDelete && (
          <button style={styles.deleteButton} onClick={() => deleteEvent(event.id)}>
            Delete
          </button>
        )}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.headerCard}>
            <h1 style={styles.title}>Woodilee Bowling Club</h1>
            <p style={styles.subtitle}>Members diary, notices and club information</p>

            <div style={styles.loginBox}>
              <input
                type="password"
                placeholder="Enter PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={styles.input}
              />
              <button style={styles.button} onClick={() => handleLogin("member")}>
                Member Login
              </button>
              <button style={styles.secondaryButton} onClick={() => handleLogin("admin")}>
                Admin Login
              </button>
            </div>
          </div>

          {errorMessage && <div style={styles.errorCard}>{errorMessage}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <p style={styles.subtitle}>Members diary, notices and club information</p>

          <div style={styles.loggedInBar}>
            <div style={styles.loggedInText}>
              Logged in as <strong>{isAdmin ? "Admin" : "Member"}</strong>
            </div>
            <button style={styles.secondaryButton} onClick={handleLogout}>
              Logout
            </button>
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
          {isAdmin && (
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
                upcomingEvents.map((event) => renderEventCard(event))
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
              sortedEvents.map((event) => renderEventCard(event, isAdmin))
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
                  {isAdmin && (
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
                      {getField(member, ["section"]) && (
                        <div style={styles.listMeta}>Section: {getField(member, ["section"])}</div>
                      )}
                      {isAdmin && (
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
                  {isAdmin && (
                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteOfficeBearer(item.id)}
                    >
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
                  {isAdmin && (
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
                    {isAdmin && (
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

        {isAdmin && activeTab === "admin" && (
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
    padding: 16,
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
    padding: 22,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 34,
    color: "#7a2638",
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#444",
    fontSize: 18,
  },
  loginBox: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 20,
    alignItems: "center",
  },
  loggedInBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 18,
  },
  loggedInText: {
    color: "#333",
    fontSize: 15,
  },
  tabBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tab: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "#f1d8de",
    color: "#5b1d2a",
    fontWeight: 700,
    cursor: "pointer",
  },
  activeTab: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
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
    fontSize: 24,
    color: "#7a2638",
  },
  subHeading: {
    marginTop: 0,
    marginBottom: 10,
    color: "#5b1d2a",
    fontSize: 18,
  },
  paragraph: {
    color: "#444",
    lineHeight: 1.45,
    marginTop: 6,
    marginBottom: 6,
  },
  listItem: {
    border: "1px solid #e5d7db",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    background: "#fffafc",
  },
  listTitle: {
    fontWeight: 700,
    color: "#5b1d2a",
    marginBottom: 4,
    fontSize: 17,
  },
  listMeta: {
    color: "#555",
    fontSize: 15,
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    marginBottom: 10,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    marginBottom: 10,
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },
  button: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#555",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButton: {
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#b00020",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  link: {
    color: "#7a2638",
    fontWeight: 700,
    textDecoration: "none",
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
};
