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

function cleanPhone(phone) {
  return safeString(phone).replace(/\s+/g, "");
}

function formatPhoneForDisplay(phone) {
  return safeString(phone).trim();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return safeString(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const raw = safeString(timeStr).trim();

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    const temp = new Date();
    temp.setHours(h, m, 0, 0);
    return temp.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const parsed = new Date(`2000-01-01T${raw}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return raw;
}

function formatDateTime(dateStr, timeStr) {
  const d = formatDate(dateStr);
  const t = formatTime(timeStr);
  if (d && t) return `${d} at ${t}`;
  return d || t || "";
}

function getPublicFileUrl(row) {
  const directUrl =
    row.file_url ||
    row.url ||
    row.link ||
    row.public_url ||
    row.download_url ||
    "";

  if (directUrl) return directUrl;

  const filePath =
    row.file_path || row.path || row.storage_path || row.filename || "";

  if (!filePath) return "";

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || "";
}

async function tryReadTable(tableNames, queryBuilder) {
  for (const table of tableNames) {
    try {
      const query = queryBuilder(supabase.from(table));
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return { table, data };
      }
    } catch (err) {
      // try next table
    }
  }
  return { table: null, data: [] };
}

function normaliseDiaryRow(row) {
  return {
    id: row.id ?? row.event_id ?? Math.random().toString(36),
    title: safeString(row.title || row.name || row.event || row.heading || "Untitled event"),
    date: safeString(row.date || row.event_date || row.diary_date || row.start_date || ""),
    time: safeString(row.time || row.event_time || row.start_time || ""),
    venue: safeString(row.venue || row.location || row.place || ""),
    details: safeString(row.details || row.description || row.notes || ""),
    sortDate:
      row.date || row.event_date || row.diary_date || row.start_date || "",
  };
}

function normaliseNoticeRow(row) {
  return {
    id: row.id ?? row.notice_id ?? Math.random().toString(36),
    title: safeString(row.title || row.heading || row.notice || "Notice"),
    body: safeString(row.body || row.content || row.message || row.details || ""),
    date: safeString(row.date || row.notice_date || row.created_at || row.posted_at || ""),
    pinned: Boolean(row.pinned || row.is_pinned || row.featured),
  };
}

function normaliseMemberRow(row) {
  const name =
    safeString(
      row.name ||
        row.member_name ||
        [row.first_name, row.last_name].filter(Boolean).join(" ") ||
        row.full_name
    ).trim() || "Unnamed member";

  return {
    id: row.id ?? row.member_id ?? Math.random().toString(36),
    name,
    phone: safeString(row.phone || row.mobile || row.telephone || ""),
    whatsapp: safeString(row.whatsapp || row.phone || row.mobile || ""),
    email: safeString(row.email || ""),
    section: safeString(row.section || row.category || row.group || "Members"),
  };
}

function normaliseOfficeRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    role: safeString(row.role || row.position || row.title || "Role"),
    name: safeString(row.name || row.person || row.member_name || ""),
    phone: safeString(row.phone || row.mobile || ""),
    whatsapp: safeString(row.whatsapp || row.phone || row.mobile || ""),
    email: safeString(row.email || ""),
    sort_order: Number(row.sort_order ?? row.display_order ?? row.order_no ?? 9999),
  };
}

function normaliseCoachRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    name: safeString(row.name || row.coach || row.member_name || ""),
    phone: safeString(row.phone || row.mobile || ""),
    whatsapp: safeString(row.whatsapp || row.phone || row.mobile || ""),
    email: safeString(row.email || ""),
    details: safeString(row.details || row.notes || row.description || ""),
    sort_order: Number(row.sort_order ?? row.display_order ?? row.order_no ?? 9999),
  };
}

function normaliseDocumentRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    title: safeString(row.title || row.name || row.document || row.filename || "Document"),
    description: safeString(row.description || row.details || row.notes || ""),
    url: getPublicFileUrl(row),
    date: safeString(row.date || row.created_at || row.uploaded_at || ""),
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminPin, setAdminPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const [diaryRows, setDiaryRows] = useState([]);
  const [noticeRows, setNoticeRows] = useState([]);
  const [memberRows, setMemberRows] = useState([]);
  const [officeRows, setOfficeRows] = useState([]);
  const [coachRows, setCoachRows] = useState([]);
  const [documentRows, setDocumentRows] = useState([]);

  async function loadAllData() {
    setLoading(true);
    setStatusMessage("");

    const diaryPromise = tryReadTable(
      ["diary", "events", "fixtures"],
      (t) => t.select("*").order("date", { ascending: true }).limit(200)
    );

    const noticesPromise = tryReadTable(
      ["notices", "noticeboard", "news"],
      (t) => t.select("*").order("date", { ascending: false }).limit(200)
    );

    const membersPromise = tryReadTable(
      ["members", "club_members"],
      (t) => t.select("*").order("name", { ascending: true }).limit(500)
    );

    const officePromise = tryReadTable(
      ["office_bearers", "officebearers", "office"],
      (t) => t.select("*").order("sort_order", { ascending: true }).limit(100)
    );

    const coachesPromise = tryReadTable(
      ["club_coaches", "coaches"],
      (t) => t.select("*").order("sort_order", { ascending: true }).limit(100)
    );

    const docsPromise = tryReadTable(
      ["documents", "docs", "files"],
      (t) => t.select("*").order("date", { ascending: false }).limit(200)
    );

    const [
      diaryRes,
      noticesRes,
      membersRes,
      officeRes,
      coachesRes,
      docsRes,
    ] = await Promise.all([
      diaryPromise,
      noticesPromise,
      membersPromise,
      officePromise,
      coachesPromise,
      docsPromise,
    ]);

    const diary = (diaryRes.data || []).map(normaliseDiaryRow);
    const notices = (noticesRes.data || []).map(normaliseNoticeRow);
    const members = (membersRes.data || []).map(normaliseMemberRow);
    const office = (officeRes.data || []).map(normaliseOfficeRow);
    const coaches = (coachesRes.data || []).map(normaliseCoachRow);
    const docs = (docsRes.data || []).map(normaliseDocumentRow);

    setDiaryRows(
      diary.sort((a, b) => {
        const aa = new Date(`${a.date || "9999-12-31"}T${a.time || "23:59"}`).getTime();
        const bb = new Date(`${b.date || "9999-12-31"}T${b.time || "23:59"}`).getTime();
        return aa - bb;
      })
    );

    setNoticeRows(
      notices.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
    );

    setMemberRows(
      members.sort((a, b) => a.name.localeCompare(b.name, "en-GB"))
    );

    setOfficeRows(
      office.sort((a, b) => a.sort_order - b.sort_order)
    );

    setCoachRows(
      coaches.sort((a, b) => a.sort_order - b.sort_order)
    );

    setDocumentRows(docs);

    if (
      !diaryRes.table &&
      !noticesRes.table &&
      !membersRes.table &&
      !officeRes.table &&
      !coachesRes.table &&
      !docsRes.table
    ) {
      setStatusMessage(
        "No data tables were found. Check your Supabase table names and read permissions."
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const upcomingDiary = useMemo(() => {
    const now = new Date();
    const future = diaryRows.filter((row) => {
      const when = new Date(`${row.date || "9999-12-31"}T${row.time || "23:59"}`);
      return !Number.isNaN(when.getTime()) && when >= now;
    });
    return future.slice(0, 5);
  }, [diaryRows]);

  const latestNotices = useMemo(() => noticeRows.slice(0, 5), [noticeRows]);

  const membersBySection = useMemo(() => {
    const grouped = {
      Gents: [],
      Ladies: [],
      Associate: [],
      Members: [],
      Other: [],
    };

    memberRows.forEach((m) => {
      const s = m.section.toLowerCase();
      if (s.includes("gent")) grouped.Gents.push(m);
      else if (s.includes("lad")) grouped.Ladies.push(m);
      else if (s.includes("assoc")) grouped.Associate.push(m);
      else if (s.includes("member")) grouped.Members.push(m);
      else grouped.Other.push(m);
    });

    return grouped;
  }, [memberRows]);

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPin === ADMIN_PIN) {
      setIsAdmin(true);
      setAdminPin("");
    } else {
      alert("Incorrect admin PIN");
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
  }

  function ContactLinks({ phone, whatsapp, email }) {
    const displayPhone = formatPhoneForDisplay(phone);
    const telPhone = cleanPhone(phone);
    const waPhone = cleanPhone(whatsapp);

    return (
      <div style={styles.contactRow}>
        {displayPhone ? (
          <a href={`tel:${telPhone}`} style={styles.contactLink}>
            Call
          </a>
        ) : null}
        {waPhone ? (
          <a
            href={`https://wa.me/${waPhone.replace(/^\+/, "")}`}
            target="_blank"
            rel="noreferrer"
            style={styles.contactLink}
          >
            WhatsApp
          </a>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} style={styles.contactLink}>
            Email
          </a>
        ) : null}
      </div>
    );
  }

  function SectionTitle({ children, rightSide = null }) {
    return (
      <div style={styles.sectionTitleRow}>
        <h2 style={styles.sectionTitle}>{children}</h2>
        {rightSide}
      </div>
    );
  }

  function renderHome() {
    const nextEvent = upcomingDiary[0];

    return (
      <>
        <div style={styles.grid2}>
          <div style={styles.card}>
            <SectionTitle>Next Event</SectionTitle>
            {nextEvent ? (
              <div>
                <div style={styles.itemTitle}>{nextEvent.title}</div>
                <div style={styles.metaText}>
                  {formatDateTime(nextEvent.date, nextEvent.time)}
                </div>
                {nextEvent.venue ? (
                  <div style={styles.metaText}>Venue: {nextEvent.venue}</div>
                ) : null}
                {nextEvent.details ? (
                  <p style={styles.bodyText}>{nextEvent.details}</p>
                ) : null}
              </div>
            ) : (
              <p style={styles.emptyText}>No upcoming events</p>
            )}
          </div>

          <div style={styles.card}>
            <SectionTitle>Admin</SectionTitle>
            {isAdmin ? (
              <div>
                <div style={styles.adminBadge}>Admin logged in</div>
                <div style={styles.buttonRow}>
                  <button style={styles.secondaryBtn} onClick={loadAllData}>
                    Refresh Data
                  </button>
                  <button style={styles.logoutBtn} onClick={handleAdminLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <p style={styles.bodyText}>
                Members can use the app without logging in. Admin login is only for management access.
              </p>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <SectionTitle>Latest Notices</SectionTitle>
          {latestNotices.length ? (
            latestNotices.map((notice) => (
              <div key={notice.id} style={styles.listItem}>
                <div style={styles.itemTitle}>
                  {notice.pinned ? "📌 " : ""}
                  {notice.title}
                </div>
                {notice.date ? (
                  <div style={styles.metaText}>{formatDate(notice.date)}</div>
                ) : null}
                {notice.body ? <p style={styles.bodyText}>{notice.body}</p> : null}
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>No notices available</p>
          )}
        </div>
      </>
    );
  }

  function renderDiary() {
    return (
      <div style={styles.card}>
        <SectionTitle
          rightSide={
            <span style={styles.countBadge}>{diaryRows.length} entries</span>
          }
        >
          Diary
        </SectionTitle>

        {diaryRows.length ? (
          diaryRows.map((item) => (
            <div key={item.id} style={styles.listItem}>
              <div style={styles.itemTitle}>{item.title}</div>
              <div style={styles.metaText}>
                {formatDateTime(item.date, item.time)}
              </div>
              {item.venue ? (
                <div style={styles.metaText}>Venue: {item.venue}</div>
              ) : null}
              {item.details ? <p style={styles.bodyText}>{item.details}</p> : null}
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>No diary entries found</p>
        )}
      </div>
    );
  }

  function renderNotices() {
    return (
      <div style={styles.card}>
        <SectionTitle
          rightSide={
            <span style={styles.countBadge}>{noticeRows.length} notices</span>
          }
        >
          Noticeboard
        </SectionTitle>

        {noticeRows.length ? (
          noticeRows.map((notice) => (
            <div key={notice.id} style={styles.listItem}>
              <div style={styles.itemTitle}>
                {notice.pinned ? "📌 " : ""}
                {notice.title}
              </div>
              {notice.date ? (
                <div style={styles.metaText}>{formatDate(notice.date)}</div>
              ) : null}
              {notice.body ? <p style={styles.bodyText}>{notice.body}</p> : null}
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>No notices found</p>
        )}
      </div>
    );
  }

  function renderMemberSection(title, rows) {
    if (!rows.length) return null;

    return (
      <div style={styles.card} key={title}>
        <SectionTitle
          rightSide={<span style={styles.countBadge}>{rows.length}</span>}
        >
          {title}
        </SectionTitle>

        <div style={styles.peopleGrid}>
          {rows.map((member) => (
            <div key={member.id} style={styles.personCard}>
              <div style={styles.personName}>{member.name}</div>
              {member.phone ? (
                <div style={styles.metaText}>Phone: {member.phone}</div>
              ) : null}
              {member.email ? (
                <div style={styles.metaText}>Email: {member.email}</div>
              ) : null}
              <ContactLinks
                phone={member.phone}
                whatsapp={member.whatsapp}
                email={member.email}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderMembers() {
    return (
      <>
        {renderMemberSection("Gents", membersBySection.Gents)}
        {renderMemberSection("Ladies", membersBySection.Ladies)}
        {renderMemberSection("Associate", membersBySection.Associate)}
        {renderMemberSection("Members", membersBySection.Members)}
        {renderMemberSection("Other", membersBySection.Other)}

        {!memberRows.length ? (
          <div style={styles.card}>
            <p style={styles.emptyText}>No members found</p>
          </div>
        ) : null}
      </>
    );
  }

  function renderOffice() {
    return (
      <div style={styles.card}>
        <SectionTitle
          rightSide={<span style={styles.countBadge}>{officeRows.length}</span>}
        >
          Office Bearers
        </SectionTitle>

        {officeRows.length ? (
          <div style={styles.peopleGrid}>
            {officeRows.map((person) => (
              <div key={person.id} style={styles.personCard}>
                <div style={styles.personRole}>{person.role}</div>
                <div style={styles.personName}>{person.name}</div>
                {person.phone ? (
                  <div style={styles.metaText}>Phone: {person.phone}</div>
                ) : null}
                {person.email ? (
                  <div style={styles.metaText}>Email: {person.email}</div>
                ) : null}
                <ContactLinks
                  phone={person.phone}
                  whatsapp={person.whatsapp}
                  email={person.email}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No office bearers found</p>
        )}
      </div>
    );
  }

  function renderCoaches() {
    return (
      <div style={styles.card}>
        <SectionTitle
          rightSide={<span style={styles.countBadge}>{coachRows.length}</span>}
        >
          Club Coaches
        </SectionTitle>

        {coachRows.length ? (
          <div style={styles.peopleGrid}>
            {coachRows.map((coach) => (
              <div key={coach.id} style={styles.personCard}>
                <div style={styles.personName}>{coach.name}</div>
                {coach.phone ? (
                  <div style={styles.metaText}>Phone: {coach.phone}</div>
                ) : null}
                {coach.email ? (
                  <div style={styles.metaText}>Email: {coach.email}</div>
                ) : null}
                {coach.details ? (
                  <p style={styles.bodyText}>{coach.details}</p>
                ) : null}
                <ContactLinks
                  phone={coach.phone}
                  whatsapp={coach.whatsapp}
                  email={coach.email}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>No coaches found</p>
        )}
      </div>
    );
  }

  function renderDocuments() {
    return (
      <div style={styles.card}>
        <SectionTitle
          rightSide={
            <span style={styles.countBadge}>{documentRows.length} files</span>
          }
        >
          Documents
        </SectionTitle>

        {documentRows.length ? (
          documentRows.map((doc) => (
            <div key={doc.id} style={styles.listItem}>
              <div style={styles.itemTitle}>{doc.title}</div>
              {doc.date ? (
                <div style={styles.metaText}>{formatDate(doc.date)}</div>
              ) : null}
              {doc.description ? (
                <p style={styles.bodyText}>{doc.description}</p>
              ) : null}
              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.docLink}
                >
                  Open document
                </a>
              ) : (
                <div style={styles.metaText}>No link available</div>
              )}
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>No documents found</p>
        )}
      </div>
    );
  }

  function renderActiveTab() {
    if (loading) {
      return (
        <div style={styles.card}>
          <p style={styles.bodyText}>Loading club information...</p>
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
        return renderOffice();
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
          <div style={styles.headerLeft}>
            <img src={logo} alt="Club logo" style={styles.logo} />
            <div>
              <h1 style={styles.title}>{CLUB_NAME}</h1>
              <p style={styles.subtitle}>{CLUB_SUBTITLE}</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            {!isAdmin ? (
              <form onSubmit={handleAdminLogin} style={styles.loginForm}>
                <input
                  type="password"
                  placeholder="Admin PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={styles.input}
                />
                <button type="submit" style={styles.loginBtn}>
                  Login
                </button>
              </form>
            ) : (
              <div style={styles.buttonRow}>
                <span style={styles.adminBadge}>Admin logged in</span>
                <button style={styles.secondaryBtn} onClick={loadAllData}>
                  Refresh
                </button>
                <button style={styles.logoutBtn} onClick={handleAdminLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.activeTab : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {statusMessage ? (
          <div style={styles.warningBox}>{statusMessage}</div>
        ) : null}

        <div style={styles.content}>{renderActiveTab()}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #78162a 0%, #8d1730 42%, #a41d39 100%)",
    padding: 16,
    fontFamily: "Arial, sans-serif",
    color: "#1f1f1f",
    boxSizing: "border-box",
  },
  wrap: {
    maxWidth: 1300,
    margin: "0 auto",
  },
  header: {
    background: "#efefef",
    borderRadius: 28,
    padding: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.5)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    minWidth: 280,
    flex: 1,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    minWidth: 280,
  },
  logo: {
    width: 104,
    height: 104,
    objectFit: "contain",
    borderRadius: 18,
    background: "transparent",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "clamp(2rem, 3.2vw, 3.2rem)",
    fontWeight: 800,
    lineHeight: 1.1,
    color: "#1f2430",
  },
  subtitle: {
    margin: "12px 0 0 0",
    fontSize: "clamp(1.1rem, 1.8vw, 1.8rem)",
    color: "#20242a",
  },
  loginForm: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  input: {
    width: 220,
    maxWidth: "100%",
    padding: "14px 16px",
    fontSize: 22,
    borderRadius: 12,
    border: "1px solid #b7b7b7",
    outline: "none",
    boxSizing: "border-box",
  },
  loginBtn: {
    padding: "14px 18px",
    fontSize: 22,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#7f1730",
    color: "#fff",
    fontWeight: 700,
  },
  logoutBtn: {
    padding: "11px 14px",
    fontSize: 16,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#4b5563",
    color: "#fff",
    fontWeight: 700,
  },
  secondaryBtn: {
    padding: "11px 14px",
    fontSize: 16,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#8b1e35",
    color: "#fff",
    fontWeight: 700,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  adminBadge: {
    background: "#e8f6ed",
    color: "#15643a",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 15,
  },
  tabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
    marginBottom: 18,
  },
  tab: {
    padding: "12px 18px",
    fontSize: 20,
    borderRadius: 14,
    border: "none",
    background: "#f5f5f5",
    color: "#1f1f1f",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
  },
  activeTab: {
    background: "#f2c94c",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  card: {
    background: "#f4f4f4",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 8px 22px rgba(0,0,0,0.14)",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "clamp(1.6rem, 2.3vw, 2.3rem)",
    color: "#1f2430",
    fontWeight: 800,
  },
  countBadge: {
    background: "#8b1e35",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
  },
  listItem: {
    padding: "14px 0",
    borderBottom: "1px solid #d9d9d9",
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1f2430",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 17,
    color: "#444",
    marginBottom: 4,
    wordBreak: "break-word",
  },
  bodyText: {
    margin: "8px 0 0 0",
    fontSize: 18,
    lineHeight: 1.5,
    color: "#232323",
  },
  emptyText: {
    margin: 0,
    fontSize: 18,
    color: "#555",
  },
  peopleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: 16,
  },
  personCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    border: "1px solid #e2e2e2",
  },
  personRole: {
    fontSize: 16,
    fontWeight: 700,
    color: "#8b1e35",
    marginBottom: 6,
  },
  personName: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1f2430",
    marginBottom: 8,
    lineHeight: 1.25,
  },
  contactRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  contactLink: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eef2f7",
    color: "#1f2430",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  },
  docLink: {
    display: "inline-block",
    marginTop: 8,
    padding: "10px 14px",
    borderRadius: 12,
    background: "#8b1e35",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  },
  warningBox: {
    background: "#fff3cd",
    color: "#7a5a00",
    border: "1px solid #f1d27a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: 700,
  },
};
