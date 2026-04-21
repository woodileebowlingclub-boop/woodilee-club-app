import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/WBC Logo.png";

const ADMIN_PIN = "1954";
const CLUB_NAME = "Woodilee Bowling Club";
const CLUB_SUBTITLE = "Members diary, notices and club information";

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return safeString(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr, timeStr) {
  const datePart = formatDate(dateStr);
  const timePart = safeString(timeStr);
  if (datePart && timePart) return `${datePart} • ${timePart}`;
  return datePart || timePart || "";
}

function normalisePhoneForWhatsApp(phone) {
  const raw = safeString(phone).replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw.slice(1);
  if (raw.startsWith("00")) return raw.slice(2);
  if (raw.startsWith("0")) return `44${raw.slice(1)}`;
  return raw;
}

function WhatsAppButton({ phone }) {
  const waNumber = normalisePhoneForWhatsApp(phone);
  if (!waNumber) return null;

  return (
    <a
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noreferrer"
      style={styles.whatsAppButton}
    >
      WhatsApp
    </a>
  );
}

function getEventDisplayDate(event) {
  return getField(event, ["date_text"]) || formatDateTime(
    getField(event, ["event_date", "date", "eventDate"]),
    getField(event, ["event_time", "time", "eventTime"])
  );
}

function getEventSortValue(event) {
  const dateText = getField(event, ["date_text"], "");
  const parsed = Date.parse(dateText);
  if (!Number.isNaN(parsed)) return parsed;

  const alt = getField(event, ["event_date", "date", "eventDate"], "");
  const altParsed = Date.parse(alt);
  if (!Number.isNaN(altParsed)) return altParsed;

  return Number.MAX_SAFE_INTEGER;
}

export default function App() {
  const [accessMode, setAccessMode] = useState("member");
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
    text: "",
    important: false,
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    notes: "",
  });
  const [memberForm, setMemberForm] = useState({
    full_name: "",
    section: "Gents",
    phone: "",
    email: "",
  });
  const [officeForm, setOfficeForm] = useState({
    role: "",
    name: "",
    phone: "",
    email: "",
    display_order: "",
  });
  const [coachForm, setCoachForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    notes: "",
  });
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

    const [
      eventsRes,
      noticesPointsRes,
      noticesPostsRes,
      membersRes,
      officeRes,
      coachesRes,
      docsRes,
    ] = await Promise.all([
      supabase.from("events").select("*"),
      supabase.from("information_points").select("*"),
      supabase.from("information_posts").select("*"),
      supabase.from("members").select("*").order("full_name", { ascending: true }),
      supabase.from("office_bearers").select("*"),
      supabase.from("club_coaches").select("*").order("name", { ascending: true }),
      supabase.from("documents").select("*").order("id", { ascending: false }),
    ]);

    const errors = [
      eventsRes.error,
      noticesPointsRes.error,
      noticesPostsRes.error,
      membersRes.error,
      officeRes.error,
      coachesRes.error,
      docsRes.error,
    ]
      .filter(Boolean)
      .map((err) => err.message);

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
    }

    const combinedNotices = [
      ...(noticesPointsRes.data || []),
      ...(noticesPostsRes.data || []),
    ];

    setEvents(eventsRes.data || []);
    setNotices(combinedNotices);
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

  function showSaved(message = "Saved") {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2500);
  }

  function handleAdminLogin() {
    const enteredPin = window.prompt("Enter admin PIN");
    if (enteredPin === ADMIN_PIN) {
      setAccessMode("admin");
      clearMessages();
      return;
    }
    if (enteredPin !== null) {
      alert("Incorrect admin PIN");
    }
  }

  function handleLogout() {
    setAccessMode("member");
    setActiveTab("home");
  }

  async function addNotice() {
    const title = noticeForm.title.trim();
    const text = noticeForm.text.trim();

    if (!title || !text) {
      alert("Enter a notice title and text");
      return;
    }

    setSaving(true);
    clearMessages();

    const payload = {
      title,
      text,
      important: noticeForm.important,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("information_points").insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add notice");
      setSaving(false);
      return;
    }

    setNoticeForm({ title: "", text: "", important: false });
    await loadAll();
    setSaving(false);
    showSaved("Notice added");
  }

  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;
    setSaving(true);
    clearMessages();

    const deletePoints = await supabase.from("information_points").delete().eq("id", id);
    if (!deletePoints.error) {
      await loadAll();
      setSaving(false);
      showSaved("Notice deleted");
      return;
    }

    const deletePosts = await supabase.from("information_posts").delete().eq("id", id);
    if (deletePosts.error) {
      setErrorMessage(deletePosts.error.message || deletePoints.error.message || "Failed to delete notice");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Notice deleted");
  }

  async function addEvent() {
    const title = eventForm.title.trim();
    if (!title || !eventForm.event_date) {
      alert("Enter an event title and date");
      return;
    }

    setSaving(true);
    clearMessages();

    const payload = {
      title,
      event_date: eventForm.event_date,
      event_time: eventForm.event_time || null,
      location: eventForm.location.trim() || null,
      notes: eventForm.notes.trim() || null,
      date_text: formatDate(eventForm.event_date),
    };

    const { error } = await supabase.from("events").insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add event");
      setSaving(false);
      return;
    }

    setEventForm({ title: "", event_date: "", event_time: "", location: "", notes: "" });
    await loadAll();
    setSaving(false);
    showSaved("Event added");
  }

  async function deleteEvent(id) {
    if (!window.confirm("Delete this diary entry?")) return;
    setSaving(true);
    clearMessages();

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message || "Failed to delete event");
      setSaving(false);
      return;
    }

    await loadAll();
    setSaving(false);
    showSaved("Diary entry deleted");
  }

  async function addMember() {
    const full_name = memberForm.full_name.trim();
    if (!full_name) {
      alert("Enter member name");
      return;
    }

    setSaving(true);
    clearMessages();

    const payload = {
      full_name,
      section: memberForm.section,
      phone: memberForm.phone.trim() || null,
      email: memberForm.email.trim() || null,
    };

    const { error } = await supabase.from("members").insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add member");
      setSaving(false);
      return;
    }

    setMemberForm({ full_name: "", section: "Gents", phone: "", email: "" });
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

    const payload = {
      role,
      name,
      phone: officeForm.phone.trim() || null,
      email: officeForm.email.trim() || null,
      display_order: officeForm.display_order ? Number(officeForm.display_order) : officeBearers.length + 1,
    };

    const { error } = await supabase.from("office_bearers").insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add office bearer");
      setSaving(false);
      return;
    }

    setOfficeForm({ role: "", name: "", phone: "", email: "", display_order: "" });
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

    const payload = {
      name,
      role: coachForm.role.trim() || null,
      phone: coachForm.phone.trim() || null,
      email: coachForm.email.trim() || null,
      notes: coachForm.notes.trim() || null,
    };

    const { error } = await supabase.from("club_coaches").insert(payload);

    if (error) {
      setErrorMessage(error.message || "Failed to add coach");
      setSaving(false);
      return;
    }

    setCoachForm({ name: "", role: "", phone: "", email: "", notes: "" });
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

    const payload = {
      title,
      file_url: documentForm.file_url.trim() || null,
      description: documentForm.description.trim() || null,
    };

    const { error } = await supabase.from("documents").insert(payload);

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

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return members;
    return members.filter((member) => {
      const name = safeString(getField(member, ["full_name", "name"])).toLowerCase();
      const section = safeString(getField(member, ["section", "member_type"])).toLowerCase();
      return name.includes(search) || section.includes(search);
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
      const section = safeString(getField(member, ["section", "member_type"], "Other"));
      if (groups[section]) {
        groups[section].push(member);
      } else {
        groups.Other.push(member);
      }
    });

    return groups;
  }, [filteredMembers]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => getEventSortValue(a) - getEventSortValue(b))
      .slice(0, 5);
  }, [events]);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      const aImportant = !!getField(a, ["important", "is_important"], false);
      const bImportant = !!getField(b, ["important", "is_important"], false);
      if (aImportant !== bImportant) return aImportant ? -1 : 1;

      const aDate = getField(a, ["created_at", "date", "posted_at"], "");
      const bDate = getField(b, ["created_at", "date", "posted_at"], "");
      if (aDate && bDate) return new Date(bDate) - new Date(aDate);

      return Number(getField(b, ["id"], 0)) - Number(getField(a, ["id"], 0));
    });
  }, [notices]);

  const isAdmin = accessMode === "admin";

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.headerCard}>
          <div style={styles.headerRow}>
            <img src={logo} alt="Woodilee Bowling Club Logo" style={styles.logo} />
            <div>
              <h1 style={styles.title}>{CLUB_NAME}</h1>
              <p style={styles.subtitle}>{CLUB_SUBTITLE}</p>
            </div>
          </div>

          {!isAdmin ? (
            <div style={styles.loggedInBar}>
              <div style={styles.loggedInText}>Open member access</div>
              <button style={styles.secondaryButton} onClick={handleAdminLogin}>
                Admin Login
              </button>
            </div>
          ) : (
            <div style={styles.loggedInBar}>
              <div style={styles.loggedInText}>
                Logged in as <strong>Admin</strong>
              </div>
              <button style={styles.secondaryButton} onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
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
        {!loading && errorMessage && <div style={styles.errorCard}>{errorMessage}</div>}
        {!loading && successMessage && <div style={styles.successCard}>{successMessage}</div>}

        {!loading && activeTab === "home" && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Welcome</h3>
              <p style={styles.paragraph}>
                Welcome to the club app. Use the tabs above to view diary dates, notices, members,
                office bearers, coaches and documents.
              </p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Upcoming Diary</h3>
              {upcomingEvents.length === 0 ? (
                <p style={styles.paragraph}>No diary entries yet.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} style={styles.listItem}>
                    <div style={styles.listTitle}>
                      {getField(event, ["title", "event_title"], "Untitled event")}
                    </div>
                    <div style={styles.listMeta}>{getEventDisplayDate(event)}</div>
                    {getField(event, ["location"]) && (
                      <div style={styles.listMeta}>{getField(event, ["location"])}</div>
                    )}
                    {getField(event, ["note", "notes", "description"]) && (
                      <div style={styles.paragraph}>
                        {getField(event, ["note", "notes", "description"])}
                      </div>
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
                sortedNotices.slice(0, 5).map((notice, index) => (
                  <div key={`${notice.id || "notice"}-${index}`} style={styles.listItem}>
                    <div style={styles.listTitle}>
                      {getField(notice, ["title", "heading"], "Notice")}
                      {getField(notice, ["important", "is_important"], false) ? " • Important" : ""}
                    </div>
                    <div style={styles.paragraph}>
                      {getField(notice, ["text", "content", "description", "body"], "")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === "diary" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Diary</h3>
            {events.length === 0 ? (
              <p style={styles.paragraph}>No diary entries yet.</p>
            ) : (
              [...events]
                .sort((a, b) => getEventSortValue(a) - getEventSortValue(b))
                .map((event) => (
                  <div key={event.id} style={styles.listItem}>
                    <div style={styles.listTitle}>
                      {getField(event, ["title", "event_title"], "Untitled event")}
                    </div>
                    <div style={styles.listMeta}>{getEventDisplayDate(event)}</div>
                    {getField(event, ["location"]) && (
                      <div style={styles.listMeta}>Location: {getField(event, ["location"])}</div>
                    )}
                    {getField(event, ["note", "notes", "description"]) && (
                      <div style={styles.paragraph}>
                        {getField(event, ["note", "notes", "description"])}
                      </div>
                    )}
                    {isAdmin && (
                      <button style={styles.deleteButton} onClick={() => deleteEvent(event.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {!loading && activeTab === "notices" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Notices</h3>
            {sortedNotices.length === 0 ? (
              <p style={styles.paragraph}>No notices yet.</p>
            ) : (
              sortedNotices.map((notice, index) => (
                <div key={`${notice.id || "notice"}-${index}`} style={styles.listItem}>
                  <div style={styles.listTitle}>
                    {getField(notice, ["title", "heading"], "Notice")}
                    {getField(notice, ["important", "is_important"], false) ? " • Important" : ""}
                  </div>
                  <div style={styles.paragraph}>
                    {getField(notice, ["text", "content", "description", "body"], "")}
                  </div>
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

        {!loading && activeTab === "members" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Members</h3>
            <input
              type="text"
              placeholder="Search members"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ ...styles.input, marginBottom: 16, maxWidth: 320 }}
            />

            {Object.entries(groupedMembers).map(([groupName, groupItems]) => (
              <div key={groupName} style={{ marginBottom: 22 }}>
                <h4 style={styles.subHeading}>{groupName}</h4>
                {groupItems.length === 0 ? (
                  <div style={styles.paragraph}>No members in this section.</div>
                ) : (
                  groupItems.map((member) => (
                    <div key={member.id} style={styles.listItem}>
                      <div style={styles.listTitle}>
                        {getField(member, ["full_name", "name"], "Unnamed member")}
                      </div>
                      {getField(member, ["phone"]) && (
                        <div style={styles.listMeta}>Phone: {getField(member, ["phone"])}</div>
                      )}
                      {getField(member, ["email"]) && (
                        <div style={styles.listMeta}>Email: {getField(member, ["email"])}</div>
                      )}

                      <div style={styles.actionRow}>
                        <WhatsAppButton phone={getField(member, ["phone"], "")} />
                        {isAdmin && (
                          <button style={styles.deleteButton} onClick={() => deleteMember(member.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "office" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Office Bearers</h3>
            {officeBearers.length === 0 ? (
              <p style={styles.paragraph}>No office bearers entered yet.</p>
            ) : (
              officeBearers
                .sort(
                  (a, b) =>
                    Number(getField(a, ["display_order"], 9999)) -
                    Number(getField(b, ["display_order"], 9999))
                )
                .map((item) => (
                  <div key={item.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{getField(item, ["role", "title"], "Role")}</div>
                    <div style={styles.listMeta}>{getField(item, ["name", "person_name"], "")}</div>
                    {getField(item, ["phone"]) && (
                      <div style={styles.listMeta}>Phone: {getField(item, ["phone"])}</div>
                    )}
                    {getField(item, ["email"]) && (
                      <div style={styles.listMeta}>Email: {getField(item, ["email"])}</div>
                    )}

                    <div style={styles.actionRow}>
                      <WhatsAppButton phone={getField(item, ["phone"], "")} />
                      {isAdmin && (
                        <button
                          style={styles.deleteButton}
                          onClick={() => deleteOfficeBearer(item.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {!loading && activeTab === "coaches" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Club Coaches</h3>
            {coaches.length === 0 ? (
              <p style={styles.paragraph}>No coaches entered yet.</p>
            ) : (
              coaches.map((coach) => (
                <div key={coach.id} style={styles.listItem}>
                  <div style={styles.listTitle}>{getField(coach, ["name"], "")}</div>
                  {getField(coach, ["role"]) && (
                    <div style={styles.listMeta}>{getField(coach, ["role"])}</div>
                  )}
                  {getField(coach, ["phone"]) && (
                    <div style={styles.listMeta}>Phone: {getField(coach, ["phone"])}</div>
                  )}
                  {getField(coach, ["email"]) && (
                    <div style={styles.listMeta}>Email: {getField(coach, ["email"])}</div>
                  )}
                  {getField(coach, ["notes"]) && (
                    <div style={styles.paragraph}>{getField(coach, ["notes"])}</div>
                  )}

                  <div style={styles.actionRow}>
                    <WhatsAppButton phone={getField(coach, ["phone"], "")} />
                    {isAdmin && (
                      <button style={styles.deleteButton} onClick={() => deleteCoach(coach.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "documents" && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Documents</h3>
            {documents.length === 0 ? (
              <p style={styles.paragraph}>No documents yet.</p>
            ) : (
              documents.map((doc) => {
                const url = getField(doc, ["file_url", "url", "link"], "");
                return (
                  <div key={doc.id} style={styles.listItem}>
                    <div style={styles.listTitle}>{getField(doc, ["title", "name"], "Document")}</div>
                    {getField(doc, ["description", "notes"]) && (
                      <div style={styles.paragraph}>{getField(doc, ["description", "notes"])}</div>
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

        {!loading && isAdmin && activeTab === "admin" && (
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
                placeholder="Notice text"
                value={noticeForm.text}
                onChange={(e) => setNoticeForm({ ...noticeForm, text: e.target.value })}
                style={styles.textarea}
              />
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={noticeForm.important}
                  onChange={(e) => setNoticeForm({ ...noticeForm, important: e.target.checked })}
                />
                Important notice
              </label>
              <button style={styles.button} onClick={addNotice} disabled={saving}>
                Save Notice
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Diary Entry</h3>
              <input
                type="text"
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
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
              <input
                type="text"
                placeholder="Location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Notes"
                value={eventForm.notes}
                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
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
                placeholder="Full name"
                value={memberForm.full_name}
                onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
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
              <input
                type="text"
                placeholder="Email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
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
              <input
                type="text"
                placeholder="Phone"
                value={officeForm.phone}
                onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Email"
                value={officeForm.email}
                onChange={(e) => setOfficeForm({ ...officeForm, email: e.target.value })}
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
                placeholder="Name"
                value={coachForm.name}
                onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Role"
                value={coachForm.role}
                onChange={(e) => setCoachForm({ ...coachForm, role: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone"
                value={coachForm.phone}
                onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Email"
                value={coachForm.email}
                onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="Notes"
                value={coachForm.notes}
                onChange={(e) => setCoachForm({ ...coachForm, notes: e.target.value })}
                style={styles.textarea}
              />
              <button style={styles.button} onClick={addCoach} disabled={saving}>
                Save Coach
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Add Document</h3>
              <input
                type="text"
                placeholder="Document title"
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
    background: "linear-gradient(180deg, #5b1d2a 0%, #7a2638 55%, #a33a4d 100%)",
    padding: 16,
    fontFamily: "Arial, sans-serif",
    color: "#222",
  },
  wrap: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  headerCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    marginBottom: 16,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
    borderRadius: 12,
    background: "#fff",
  },
  title: {
    margin: 0,
    color: "#7a2638",
    fontSize: 32,
    lineHeight: 1.15,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#444",
    fontSize: 18,
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
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tab: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#f1d8de",
    color: "#5b1d2a",
    cursor: "pointer",
    fontWeight: 700,
  },
  activeTab: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#7a2638",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
    padding: 12,
    marginBottom: 12,
    background: "#fffafc",
  },
  listTitle: {
    fontWeight: 700,
    color: "#5b1d2a",
    marginBottom: 4,
  },
  listMeta: {
    color: "#555",
    fontSize: 14,
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
  whatsAppButton: {
    display: "inline-block",
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#1f9d55",
    color: "#fff",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    color: "#333",
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
  actionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
};
