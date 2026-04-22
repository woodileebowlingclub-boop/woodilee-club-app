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
  if (!raw) return "";

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
    const [h, m] = raw.split(":");
    const dt = new Date();
    dt.setHours(Number(h), Number(m), 0, 0);
    return dt.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
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
    row.url ||
    row.file_url ||
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

async function tryInsert(tableNames, payloads) {
  const payloadList = Array.isArray(payloads) ? payloads : [payloads];
  for (const table of tableNames) {
    for (const payload of payloadList) {
      try {
        const { error } = await supabase.from(table).insert(payload);
        if (!error) return { ok: true, table };
      } catch (err) {
        // try next payload/table
      }
    }
  }
  return { ok: false };
}

async function tryUpdate(tableNames, idFieldNames, idValue, payloads) {
  const payloadList = Array.isArray(payloads) ? payloads : [payloads];
  for (const table of tableNames) {
    for (const idField of idFieldNames) {
      for (const payload of payloadList) {
        try {
          const { error } = await supabase
            .from(table)
            .update(payload)
            .eq(idField, idValue);
          if (!error) return { ok: true, table, idField };
        } catch (err) {
          // try next combination
        }
      }
    }
  }
  return { ok: false };
}

async function tryDelete(tableNames, idFieldNames, idValue) {
  for (const table of tableNames) {
    for (const idField of idFieldNames) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(idField, idValue);
        if (!error) return { ok: true, table, idField };
      } catch (err) {
        // try next combination
      }
    }
  }
  return { ok: false };
}

function normaliseDiaryRow(row) {
  return {
    id: row.id ?? row.event_id ?? Math.random().toString(36),
    title: safeString(row.title || row.name || row.heading),
    details: safeString(
      row.details || row.description || row.note || row.notes
    ),
    date: safeString(row.date || row.event_date || row.date_text),
    time: safeString(row.time || row.time_text || row.event_time),
  };
}

function normaliseNoticeRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    title: safeString(row.title || row.heading || row.subject),
    body: safeString(
      row.body || row.content || row.details || row.description || row.note
    ),
    date: safeString(row.date || row.created_at || row.posted_at),
    url: safeString(row.url || row.file_url || row.public_url || row.link),
  };
}

function normaliseMemberRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    name: safeString(row.name),
    phone: safeString(row.phone || row.mobile || row.telephone),
    email: safeString(row.email),
    section: safeString(row.section || row.category || "Members"),
    notes: safeString(row.notes || row.note),
  };
}

function normaliseOfficeRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    role: safeString(row.role || row.title),
    name: safeString(row.name),
    phone: safeString(row.phone || row.mobile),
    email: safeString(row.email),
    sort_order: Number(row.sort_order ?? row.display_order ?? 9999),
  };
}

function normaliseCoachRow(row) {
  return {
    id: row.id ?? Math.random().toString(36),
    name: safeString(row.name),
    phone: safeString(row.phone || row.mobile),
    email: safeString(row.email),
    notes: safeString(row.notes || row.note),
    sort_order: Number(row.sort_order ?? row.display_order ?? 9999),
  };
}

function normaliseDocumentRow(row) {
  const finalUrl = safeString(row.url || row.file_url);
  const title = safeString(row.title || "Untitled document");
  const description = safeString(row.description);
  const category = safeString(row.category || "General");
  const buttonText = safeString(row.button_text || "Open");
  const lower = `${title} ${finalUrl}`.toLowerCase();

  let fileType = "file";
  if (lower.includes(".pdf")) fileType = "pdf";
  else if (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif")
  ) {
    fileType = "image";
  } else if (lower.includes(".doc") || lower.includes(".docx")) {
    fileType = "word";
  }

  return {
    id: row.id ?? Math.random().toString(36),
    title,
    url: finalUrl,
    description,
    category,
    button_text: buttonText,
    fileType,
  };
}

function emptyDiaryForm() {
  return {
    id: "",
    title: "",
    details: "",
    date: "",
    time: "",
    repeatType: "none",
    repeatUntil: "",
    repeatCount: "8",
  };
}

function emptyNoticeForm() {
  return { id: "", title: "", body: "", date: "", file: null, url: "" };
}

function emptyMemberForm() {
  return {
    id: "",
    name: "",
    phone: "",
    email: "",
    section: "Members",
    notes: "",
  };
}

function emptyOfficeForm() {
  return { id: "", role: "", name: "", phone: "", email: "", sort_order: "" };
}

function emptyCoachForm() {
  return { id: "", name: "", phone: "", email: "", notes: "", sort_order: "" };
}

function emptyDocumentForm() {
  return {
    id: "",
    title: "",
    url: "",
    description: "",
    category: "General",
    button_text: "Open",
    file: null,
  };
}

function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(dateString, months) {
  const d = new Date(dateString);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function buildRecurringEvents(form) {
  const title = safeString(form.title).trim();
  const details = safeString(form.details).trim();
  const date = safeString(form.date).trim();
  const time = safeString(form.time).trim();

  if (!title || !date) return [];

  const base = { title, details, date, time };
  if (form.repeatType === "none") return [base];

  const results = [base];
  const repeatCount = Math.max(1, Number(form.repeatCount || 1));
  const repeatUntil = safeString(form.repeatUntil).trim();

  let currentDate = date;
  for (let i = 1; i < repeatCount; i += 1) {
    currentDate =
      form.repeatType === "monthly"
        ? addMonths(currentDate, 1)
        : addDays(currentDate, 7);

    if (repeatUntil && currentDate > repeatUntil) break;

    results.push({ ...base, date: currentDate });
  }

  return results;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [adminPin, setAdminPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [diaryRows, setDiaryRows] = useState([]);
  const [noticeRows, setNoticeRows] = useState([]);
  const [memberRows, setMemberRows] = useState([]);
  const [officeRows, setOfficeRows] = useState([]);
  const [coachRows, setCoachRows] = useState([]);
  const [documentRows, setDocumentRows] = useState([]);

  const [diaryForm, setDiaryForm] = useState(emptyDiaryForm());
  const [noticeForm, setNoticeForm] = useState(emptyNoticeForm());
  const [memberForm, setMemberForm] = useState(emptyMemberForm());
  const [officeForm, setOfficeForm] = useState(emptyOfficeForm());
  const [coachForm, setCoachForm] = useState(emptyCoachForm());
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm());
  const [documentSearch, setDocumentSearch] = useState("");

  async function loadAllData() {
    setLoading(true);
    setStatusMessage("");

    const diaryPromise = tryReadTable(
      ["diary", "events", "fixtures"],
      (t) => t.select("*").order("date", { ascending: true }).limit(500)
    );

    const noticesPromise = tryReadTable(
      ["notices", "noticeboard", "information_posts", "news"],
      (t) => t.select("*").order("date", { ascending: false }).limit(300)
    );

    const membersPromise = tryReadTable(
      ["members", "club_members"],
      (t) => t.select("*").order("name", { ascending: true }).limit(1000)
    );

    const officePromise = tryReadTable(
      ["office_bearers", "officebearers", "office"],
      (t) => t.select("*").order("sort_order", { ascending: true }).limit(100)
    );

    const coachesPromise = tryReadTable(
      ["club_coaches", "coaches"],
      (t) => t.select("*").order("sort_order", { ascending: true }).limit(100)
    );

    const documentsPromise = tryReadTable(
      ["documents", "club_documents"],
      (t) => t.select("*").order("created_at", { ascending: false }).limit(200)
    );

    const [diaryRes, noticesRes, membersRes, officeRes, coachesRes, documentsRes] =
      await Promise.all([
        diaryPromise,
        noticesPromise,
        membersPromise,
        officePromise,
        coachesPromise,
        documentsPromise,
      ]);

    setDiaryRows((diaryRes.data || []).map(normaliseDiaryRow));
    setNoticeRows((noticesRes.data || []).map(normaliseNoticeRow));
    setMemberRows((membersRes.data || []).map(normaliseMemberRow));
    setOfficeRows((officeRes.data || []).map(normaliseOfficeRow));
    setCoachRows((coachesRes.data || []).map(normaliseCoachRow));
    setDocumentRows((documentsRes.data || []).map(normaliseDocumentRow));

    setLoading(false);
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const upcomingDiary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...diaryRows].sort((a, b) =>
      (a.date || "").localeCompare(b.date || "")
    );
    return sorted.find((row) => row.date >= today) || sorted[0] || null;
  }, [diaryRows]);

  const latestNotices = useMemo(() => noticeRows.slice(0, 3), [noticeRows]);

  const groupedMembers = useMemo(() => {
    const groups = { Gents: [], Ladies: [], Associate: [], Members: [] };
    memberRows.forEach((row) => {
      const label = safeString(row.section, "Members");
      if (/gent/i.test(label)) groups.Gents.push(row);
      else if (/lad/i.test(label)) groups.Ladies.push(row);
      else if (/assoc/i.test(label)) groups.Associate.push(row);
      else groups.Members.push(row);
    });
    return groups;
  }, [memberRows]);

  const filteredDocuments = useMemo(() => {
    const q = documentSearch.trim().toLowerCase();
    if (!q) return documentRows;

    return documentRows.filter((row) => {
      return (
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q)
      );
    });
  }, [documentRows, documentSearch]);

  function handleAdminLogin() {
    if (adminPin === ADMIN_PIN) {
      setIsAdmin(true);
      setStatusMessage("Admin logged in.");
      setAdminPin("");
      return;
    }
    setStatusMessage("Incorrect admin PIN.");
  }

  function handleLogout() {
    setIsAdmin(false);
    setStatusMessage("Logged out.");
  }

  function startEditDiary(row) {
    setDiaryForm({
      id: row.id,
      title: row.title,
      details: row.details,
      date: row.date,
      time: row.time,
      repeatType: "none",
      repeatUntil: "",
      repeatCount: "8",
    });
    setActiveTab("diary");
  }

  function startEditNotice(row) {
    setNoticeForm({
      id: row.id,
      title: row.title,
      body: row.body,
      date: row.date?.slice?.(0, 10) || "",
      file: null,
      url: row.url || "",
    });
    setActiveTab("notices");
  }

  function startEditMember(row) {
    setMemberForm({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      section: row.section,
      notes: row.notes,
    });
    setActiveTab("members");
  }

  function startEditOffice(row) {
    setOfficeForm({
      id: row.id,
      role: row.role,
      name: row.name,
      phone: row.phone,
      email: row.email,
      sort_order: safeString(row.sort_order),
    });
    setActiveTab("office");
  }

  function startEditCoach(row) {
    setCoachForm({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      sort_order: safeString(row.sort_order),
    });
    setActiveTab("coaches");
  }

  function startEditDocument(row) {
    setDocumentForm({
      id: row.id,
      title: row.title,
      url: row.url,
      description: row.description,
      category: row.category || "General",
      button_text: row.button_text || "Open",
      file: null,
    });
    setActiveTab("documents");
  }

  async function saveDiary() {
    setSaving(true);
    setStatusMessage("");
    const eventsToSave = buildRecurringEvents(diaryForm);

    if (diaryForm.id) {
      const payloads = [
        {
          title: diaryForm.title,
          details: diaryForm.details,
          date: diaryForm.date,
          date_text: diaryForm.date,
          time_text: diaryForm.time,
        },
        {
          title: diaryForm.title,
          note: diaryForm.details,
          event_date: diaryForm.date,
          date_text: diaryForm.date,
          time_text: diaryForm.time,
        },
        {
          title: diaryForm.title,
          details: diaryForm.details,
          event_date: diaryForm.date,
          event_time: diaryForm.time,
        },
      ];
      const res = await tryUpdate(
        ["events", "diary", "fixtures"],
        ["id", "event_id"],
        diaryForm.id,
        payloads
      );
      setSaving(false);
      setStatusMessage(
        res.ok ? "Diary entry updated." : "Could not update diary entry."
      );
      if (res.ok) {
        setDiaryForm(emptyDiaryForm());
        loadAllData();
      }
      return;
    }

    let ok = true;
    for (const item of eventsToSave) {
      const payloads = [
        {
          title: item.title,
          details: item.details,
          date: item.date,
          date_text: item.date,
          time_text: item.time,
        },
        {
          title: item.title,
          note: item.details,
          event_date: item.date,
          date_text: item.date,
          time_text: item.time,
        },
        {
          title: item.title,
          details: item.details,
          event_date: item.date,
          event_time: item.time,
        },
      ];
      const res = await tryInsert(["events", "diary", "fixtures"], payloads);
      if (!res.ok) ok = false;
    }

    setSaving(false);
    setStatusMessage(
      ok ? "Diary entry saved." : "Could not save one or more diary entries."
    );
    if (ok) {
      setDiaryForm(emptyDiaryForm());
      loadAllData();
    }
  }

  async function saveNotice() {
    setSaving(true);
    setStatusMessage("");

    if (!safeString(noticeForm.title).trim()) {
      setSaving(false);
      setStatusMessage("Please enter a notice title.");
      return;
    }

    let finalUrl = safeString(noticeForm.url).trim();

    if (noticeForm.file) {
      const filename = `${Date.now()}-${noticeForm.file.name.replace(/\s+/g, "-")}`;
      const filePath = `notices/${filename}`;

      const uploadRes = await supabase.storage
        .from(BUCKET)
        .upload(filePath, noticeForm.file, { upsert: true });

      if (uploadRes.error) {
        setSaving(false);
        setStatusMessage(`Could not upload notice file: ${uploadRes.error.message}`);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      finalUrl = data?.publicUrl || "";
    }

    const payload = {
      title: noticeForm.title,
      body: noticeForm.body || null,
      date: noticeForm.date || null,
      url: finalUrl || null,
      file_url: finalUrl || null,
    };

    const { error } = noticeForm.id
      ? await supabase.from("notices").update(payload).eq("id", noticeForm.id)
      : await supabase.from("notices").insert(payload);

    setSaving(false);

    if (error) {
      setStatusMessage(`Could not ${noticeForm.id ? "update" : "save"} notice: ${error.message}`);
      return;
    }

    setStatusMessage(`Notice ${noticeForm.id ? "updated" : "saved"}.`);
    setNoticeForm(emptyNoticeForm());
    loadAllData();
  }

  async function saveMember() {
    setSaving(true);
    const payloads = [
      {
        name: memberForm.name,
        phone: memberForm.phone,
        email: memberForm.email,
        section: memberForm.section,
        notes: memberForm.notes,
      },
      {
        name: memberForm.name,
        mobile: memberForm.phone,
        email: memberForm.email,
        category: memberForm.section,
        note: memberForm.notes,
      },
    ];

    const res = memberForm.id
      ? await tryUpdate(["members", "club_members"], ["id"], memberForm.id, payloads)
      : await tryInsert(["members", "club_members"], payloads);

    setSaving(false);
    setStatusMessage(
      res.ok
        ? `Member ${memberForm.id ? "updated" : "saved"}.`
        : `Could not ${memberForm.id ? "update" : "save"} member.`
    );
    if (res.ok) {
      setMemberForm(emptyMemberForm());
      loadAllData();
    }
  }

  async function saveOffice() {
    setSaving(true);
    const payloads = [
      {
        role: officeForm.role,
        name: officeForm.name,
        phone: officeForm.phone,
        email: officeForm.email,
        sort_order: Number(officeForm.sort_order || 999),
      },
      {
        role: officeForm.role,
        name: officeForm.name,
        phone: officeForm.phone,
        email: officeForm.email,
        display_order: Number(officeForm.sort_order || 999),
      },
    ];

    const res = officeForm.id
      ? await tryUpdate(
          ["office_bearers", "officebearers", "office"],
          ["id"],
          officeForm.id,
          payloads
        )
      : await tryInsert(["office_bearers", "officebearers", "office"], payloads);

    setSaving(false);
    setStatusMessage(
      res.ok
        ? `Office bearer ${officeForm.id ? "updated" : "saved"}.`
        : `Could not ${officeForm.id ? "update" : "save"} office bearer.`
    );
    if (res.ok) {
      setOfficeForm(emptyOfficeForm());
      loadAllData();
    }
  }

  async function saveCoach() {
    setSaving(true);
    const payloads = [
      {
        name: coachForm.name,
        phone: coachForm.phone,
        email: coachForm.email,
        notes: coachForm.notes,
        sort_order: Number(coachForm.sort_order || 999),
      },
      {
        name: coachForm.name,
        phone: coachForm.phone,
        email: coachForm.email,
        note: coachForm.notes,
        display_order: Number(coachForm.sort_order || 999),
      },
    ];

    const res = coachForm.id
      ? await tryUpdate(["club_coaches", "coaches"], ["id"], coachForm.id, payloads)
      : await tryInsert(["club_coaches", "coaches"], payloads);

    setSaving(false);
    setStatusMessage(
      res.ok
        ? `Coach ${coachForm.id ? "updated" : "saved"}.`
        : `Could not ${coachForm.id ? "update" : "save"} coach.`
    );
    if (res.ok) {
      setCoachForm(emptyCoachForm());
      loadAllData();
    }
  }

  async function saveDocument() {
    setSaving(true);
    setStatusMessage("");

    let finalUrl = safeString(documentForm.url).trim();

    if (!safeString(documentForm.title).trim()) {
      setSaving(false);
      setStatusMessage("Please enter a document title.");
      return;
    }

    if (documentForm.file) {
      const filename = `${Date.now()}-${documentForm.file.name.replace(/\s+/g, "-")}`;
      const filePath = `documents/${filename}`;

      const uploadRes = await supabase.storage
        .from(BUCKET)
        .upload(filePath, documentForm.file, { upsert: true });

      if (uploadRes.error) {
        setSaving(false);
        setStatusMessage("Upload failed.");
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      finalUrl = data?.publicUrl || "";
    }

    const payload = {
      title: documentForm.title,
      description: documentForm.description || null,
      category: documentForm.category || "General",
      button_text: documentForm.button_text || "Open",
      url: finalUrl || null,
    };

    const { error } = documentForm.id
      ? await supabase.from("documents").update(payload).eq("id", documentForm.id)
      : await supabase.from("documents").insert(payload);

    setSaving(false);

    if (!error) {
      setStatusMessage(`Document ${documentForm.id ? "updated" : "saved"}.`);
      setDocumentForm(emptyDocumentForm());
      loadAllData();
    } else {
      setStatusMessage(`Could not ${documentForm.id ? "update" : "save"} document.`);
    }
  }

  async function handleDelete(section, id) {
    if (!window.confirm("Delete this item?")) return;

    setSaving(true);
    let res = { ok: false };

    if (section === "diary") {
      res = await tryDelete(["events", "diary", "fixtures"], ["id", "event_id"], id);
    } else if (section === "notices") {
      res = await tryDelete(["notices"], ["id"], id);
    } else if (section === "members") {
      res = await tryDelete(["members", "club_members"], ["id"], id);
    } else if (section === "office") {
      res = await tryDelete(
        ["office_bearers", "officebearers", "office"],
        ["id"],
        id
      );
    } else if (section === "coaches") {
      res = await tryDelete(["club_coaches", "coaches"], ["id"], id);
    } else if (section === "documents") {
      res = await tryDelete(["documents", "club_documents"], ["id"], id);
    }

    setSaving(false);
    setStatusMessage(res.ok ? "Deleted." : "Could not delete item.");
    if (res.ok) loadAllData();
  }

  function renderAdminBar(onSave, onClear) {
    if (!isAdmin) return null;
    return (
      <div style={styles.adminActionRow}>
        <button style={styles.saveButton} onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button style={styles.secondaryButton} onClick={onClear}>
          Clear
        </button>
      </div>
    );
  }

  function renderHome() {
    return (
      <div style={styles.sectionGrid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Next Event</h2>
          {upcomingDiary ? (
            <>
              <div style={styles.bigTitle}>{upcomingDiary.title}</div>
              <div style={styles.cardText}>
                {formatDateTime(upcomingDiary.date, upcomingDiary.time)}
              </div>
              <div style={styles.cardText}>
                {upcomingDiary.details || "No details provided"}
              </div>
            </>
          ) : (
            <div style={styles.cardText}>No diary entries available</div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Admin</h2>
          <div style={styles.adminBadge}>
            {isAdmin ? "Admin logged in" : "Admin not logged in"}
          </div>
          <div style={styles.buttonRow}>
            <button style={styles.primaryButton} onClick={loadAllData}>
              Refresh Data
            </button>
            {isAdmin ? (
              <button style={styles.secondaryButton} onClick={handleLogout}>
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <h2 style={styles.cardTitle}>Latest Notices</h2>
          {latestNotices.length ? (
            latestNotices.map((row) => (
              <div key={row.id} style={styles.listItemCompact}>
                <div style={styles.itemTitle}>{row.title}</div>
                <div style={styles.cardText}>{row.body}</div>
                {row.url ? (
                  <div style={{ marginTop: 10 }}>
                    <a
                      style={styles.primaryButton}
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open attachment
                    </a>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div style={styles.cardText}>No notices available</div>
          )}
        </div>
      </div>
    );
  }

  function renderDiary() {
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Diary</h2>
          <div style={styles.pill}>{diaryRows.length} entries</div>
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {diaryForm.id ? "Edit diary entry" : "Add diary entry"}
            </h3>

            <div style={styles.formGrid2}>
              <input
                style={styles.input}
                placeholder="Title"
                value={diaryForm.title}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, title: e.target.value })
                }
              />

              <input
                style={styles.input}
                type="date"
                value={diaryForm.date}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, date: e.target.value })
                }
              />

              <input
                style={styles.input}
                type="time"
                value={diaryForm.time}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, time: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={diaryForm.repeatType}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, repeatType: e.target.value })
                }
              >
                <option value="none">No repeat</option>
                <option value="weekly">Repeat weekly (same day)</option>
                <option value="monthly">Repeat monthly (same date)</option>
              </select>

              <input
                style={styles.input}
                type="date"
                value={diaryForm.repeatUntil}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, repeatUntil: e.target.value })
                }
                placeholder="Repeat until"
              />

              <input
                style={styles.input}
                type="number"
                min="1"
                max="52"
                value={diaryForm.repeatCount}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, repeatCount: e.target.value })
                }
                placeholder="How many times"
              />
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Details"
              value={diaryForm.details}
              onChange={(e) =>
                setDiaryForm({ ...diaryForm, details: e.target.value })
              }
            />

            {renderAdminBar(saveDiary, () => setDiaryForm(emptyDiaryForm()))}

            <div style={styles.helpText}>
              For every Monday, pick a Monday start date and choose “Repeat
              weekly”.
            </div>
          </div>
        ) : null}

        {diaryRows.length ? (
          diaryRows.map((row) => (
            <div key={row.id} style={styles.listItem}>
              <div>
                <div style={styles.itemTitle}>{row.title}</div>
                <div style={styles.itemText}>
                  {formatDateTime(row.date, row.time)}
                </div>
                {row.details ? (
                  <div style={styles.itemText}>{row.details}</div>
                ) : null}
              </div>

              {isAdmin ? (
                <div style={styles.itemButtons}>
                  <button
                    style={styles.smallButton}
                    onClick={() => startEditDiary(row)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.smallDeleteButton}
                    onClick={() => handleDelete("diary", row.id)}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No diary entries found</div>
        )}
      </div>
    );
  }

  function renderNotices() {
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Noticeboard</h2>
          <div style={styles.pill}>{noticeRows.length} notices</div>
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {noticeForm.id ? "Edit notice" : "Add notice"}
            </h3>

            <input
              style={styles.input}
              placeholder="Title"
              value={noticeForm.title}
              onChange={(e) =>
                setNoticeForm({ ...noticeForm, title: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="date"
              value={noticeForm.date}
              onChange={(e) =>
                setNoticeForm({ ...noticeForm, date: e.target.value })
              }
            />

            <textarea
              style={styles.textarea}
              placeholder="Notice text"
              value={noticeForm.body}
              onChange={(e) =>
                setNoticeForm({ ...noticeForm, body: e.target.value })
              }
            />

            <input
              style={styles.input}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) =>
                setNoticeForm({
                  ...noticeForm,
                  file: e.target.files?.[0] || null,
                })
              }
            />

            <input
              style={styles.input}
              placeholder="Or paste public file URL (optional)"
              value={noticeForm.url || ""}
              onChange={(e) =>
                setNoticeForm({ ...noticeForm, url: e.target.value })
              }
            />

            {renderAdminBar(saveNotice, () => setNoticeForm(emptyNoticeForm()))}

            <div style={styles.helpText}>
              You can upload a file or paste a public file link.
            </div>
          </div>
        ) : null}

        {noticeRows.length ? (
          noticeRows.map((row) => (
            <div key={row.id} style={styles.listItem}>
              <div>
                <div style={styles.itemTitle}>{row.title}</div>
                {row.date ? (
                  <div style={styles.itemText}>{formatDate(row.date)}</div>
                ) : null}
                <div style={styles.itemText}>{row.body}</div>

                {row.url ? (
                  <div style={{ marginTop: 12 }}>
                    <a
                      style={styles.primaryButton}
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open attachment
                    </a>
                  </div>
                ) : null}
              </div>

              {isAdmin ? (
                <div style={styles.itemButtons}>
                  <button
                    style={styles.smallButton}
                    onClick={() => startEditNotice(row)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.smallDeleteButton}
                    onClick={() => handleDelete("notices", row.id)}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No notices found</div>
        )}
      </div>
    );
  }

  function renderMembers() {
    const order = ["Gents", "Ladies", "Associate", "Members"];
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Members</h2>
          <div style={styles.pill}>{memberRows.length} members</div>
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {memberForm.id ? "Edit member" : "Add member"}
            </h3>

            <div style={styles.formGrid2}>
              <input
                style={styles.input}
                placeholder="Name"
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={memberForm.section}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, section: e.target.value })
                }
              >
                <option>Members</option>
                <option>Gents</option>
                <option>Ladies</option>
                <option>Associate</option>
              </select>

              <input
                style={styles.input}
                placeholder="Phone"
                value={memberForm.phone}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, phone: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Email"
                value={memberForm.email}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, email: e.target.value })
                }
              />
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Notes"
              value={memberForm.notes}
              onChange={(e) =>
                setMemberForm({ ...memberForm, notes: e.target.value })
              }
            />

            {renderAdminBar(saveMember, () => setMemberForm(emptyMemberForm()))}
          </div>
        ) : null}

        {order.map((section) =>
          groupedMembers[section]?.length ? (
            <div key={section} style={styles.memberGroup}>
              <h3 style={styles.subHeading}>{section}</h3>
              {groupedMembers[section].map((row) => (
                <div key={row.id} style={styles.listItem}>
                  <div>
                    <div style={styles.itemTitle}>{row.name}</div>
                    {row.phone ? (
                      <div style={styles.itemText}>
                        Phone: {formatPhoneForDisplay(row.phone)}
                      </div>
                    ) : null}
                    {row.email ? (
                      <div style={styles.itemText}>Email: {row.email}</div>
                    ) : null}
                    {row.notes ? (
                      <div style={styles.itemText}>{row.notes}</div>
                    ) : null}
                  </div>

                  <div style={styles.itemButtons}>
                    {row.phone ? (
                      <a
                        style={styles.whatsAppButton}
                        href={`https://wa.me/${cleanPhone(row.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    {isAdmin ? (
                      <button
                        style={styles.smallButton}
                        onClick={() => startEditMember(row)}
                      >
                        Edit
                      </button>
                    ) : null}
                    {isAdmin ? (
                      <button
                        style={styles.smallDeleteButton}
                        onClick={() => handleDelete("members", row.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )}

        {!memberRows.length ? (
          <div style={styles.emptyText}>No members found</div>
        ) : null}
      </div>
    );
  }

  function renderOffice() {
    const sortedRows = [...officeRows].sort((a, b) => a.sort_order - b.sort_order);
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Office Bearers</h2>
          <div style={styles.pill}>{officeRows.length}</div>
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {officeForm.id ? "Edit office bearer" : "Add office bearer"}
            </h3>

            <div style={styles.formGrid2}>
              <input
                style={styles.input}
                placeholder="Role"
                value={officeForm.role}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, role: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Name"
                value={officeForm.name}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, name: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={officeForm.phone}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, phone: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={officeForm.email}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, email: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Display order"
                type="number"
                value={officeForm.sort_order}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, sort_order: e.target.value })
                }
              />
            </div>

            {renderAdminBar(saveOffice, () => setOfficeForm(emptyOfficeForm()))}
          </div>
        ) : null}

        {sortedRows.length ? (
          sortedRows.map((row) => (
            <div key={row.id} style={styles.listItem}>
              <div>
                <div style={styles.itemTitle}>{row.role}</div>
                <div style={styles.itemText}>{row.name}</div>
                {row.phone ? (
                  <div style={styles.itemText}>
                    Phone: {formatPhoneForDisplay(row.phone)}
                  </div>
                ) : null}
                {row.email ? (
                  <div style={styles.itemText}>Email: {row.email}</div>
                ) : null}
              </div>

              <div style={styles.itemButtons}>
                {row.phone ? (
                  <a
                    style={styles.whatsAppButton}
                    href={`https://wa.me/${cleanPhone(row.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {isAdmin ? (
                  <button
                    style={styles.smallButton}
                    onClick={() => startEditOffice(row)}
                  >
                    Edit
                  </button>
                ) : null}
                {isAdmin ? (
                  <button
                    style={styles.smallDeleteButton}
                    onClick={() => handleDelete("office", row.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No office bearers found</div>
        )}
      </div>
    );
  }

  function renderCoaches() {
    const sortedRows = [...coachRows].sort((a, b) => a.sort_order - b.sort_order);
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Club Coaches</h2>
          <div style={styles.pill}>{coachRows.length}</div>
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {coachForm.id ? "Edit coach" : "Add coach"}
            </h3>

            <div style={styles.formGrid2}>
              <input
                style={styles.input}
                placeholder="Name"
                value={coachForm.name}
                onChange={(e) =>
                  setCoachForm({ ...coachForm, name: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Phone"
                value={coachForm.phone}
                onChange={(e) =>
                  setCoachForm({ ...coachForm, phone: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={coachForm.email}
                onChange={(e) =>
                  setCoachForm({ ...coachForm, email: e.target.value })
                }
              />
              <input
                style={styles.input}
                placeholder="Display order"
                type="number"
                value={coachForm.sort_order}
                onChange={(e) =>
                  setCoachForm({ ...coachForm, sort_order: e.target.value })
                }
              />
            </div>

            <textarea
              style={styles.textarea}
              placeholder="Notes"
              value={coachForm.notes}
              onChange={(e) =>
                setCoachForm({ ...coachForm, notes: e.target.value })
              }
            />

            {renderAdminBar(saveCoach, () => setCoachForm(emptyCoachForm()))}
          </div>
        ) : null}

        {sortedRows.length ? (
          sortedRows.map((row) => (
            <div key={row.id} style={styles.listItem}>
              <div>
                <div style={styles.itemTitle}>{row.name}</div>
                {row.phone ? (
                  <div style={styles.itemText}>
                    Phone: {formatPhoneForDisplay(row.phone)}
                  </div>
                ) : null}
                {row.email ? (
                  <div style={styles.itemText}>Email: {row.email}</div>
                ) : null}
                {row.notes ? (
                  <div style={styles.itemText}>{row.notes}</div>
                ) : null}
              </div>

              <div style={styles.itemButtons}>
                {row.phone ? (
                  <a
                    style={styles.whatsAppButton}
                    href={`https://wa.me/${cleanPhone(row.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {isAdmin ? (
                  <button
                    style={styles.smallButton}
                    onClick={() => startEditCoach(row)}
                  >
                    Edit
                  </button>
                ) : null}
                {isAdmin ? (
                  <button
                    style={styles.smallDeleteButton}
                    onClick={() => handleDelete("coaches", row.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No coaches found</div>
        )}
      </div>
    );
  }

  function renderDocuments() {
    return (
      <div style={styles.cardLarge}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.cardTitle}>Documents</h2>
          <div style={styles.pill}>{filteredDocuments.length} files</div>
        </div>

        <div style={{ marginTop: 18, marginBottom: 8 }}>
          <input
            style={styles.input}
            placeholder="Search documents"
            value={documentSearch}
            onChange={(e) => setDocumentSearch(e.target.value)}
          />
        </div>

        {isAdmin ? (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>
              {documentForm.id ? "Edit document" : "Add document"}
            </h3>

            <input
              style={styles.input}
              placeholder="Title"
              value={documentForm.title}
              onChange={(e) =>
                setDocumentForm({ ...documentForm, title: e.target.value })
              }
            />

            <div style={styles.formGrid2}>
              <input
                style={styles.input}
                placeholder="Category"
                value={documentForm.category}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, category: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Button text"
                value={documentForm.button_text}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, button_text: e.target.value })
                }
              />
            </div>

            <input
              style={styles.input}
              placeholder="Paste document URL here"
              value={documentForm.url}
              onChange={(e) =>
                setDocumentForm({ ...documentForm, url: e.target.value })
              }
            />

            <textarea
              style={styles.textarea}
              placeholder="Description (optional)"
              value={documentForm.description}
              onChange={(e) =>
                setDocumentForm({
                  ...documentForm,
                  description: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) =>
                setDocumentForm({
                  ...documentForm,
                  file: e.target.files?.[0] || null,
                })
              }
            />

            {renderAdminBar(saveDocument, () =>
              setDocumentForm(emptyDocumentForm())
            )}

            <div style={styles.helpText}>
              Upload a file or paste a public link. Category helps members find
              files quicker.
            </div>
          </div>
        ) : null}

        {filteredDocuments.length ? (
          filteredDocuments.map((row) => (
            <div key={row.id} style={styles.listItem}>
              <div style={{ flex: 1 }}>
                <div style={styles.itemTitle}>{row.title}</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {row.category ? (
                    <span style={styles.docCategory}>{row.category}</span>
                  ) : null}

                  {row.fileType === "pdf" ? (
                    <span style={styles.docBadgePdf}>PDF</span>
                  ) : row.fileType === "image" ? (
                    <span style={styles.docBadgeImage}>Image</span>
                  ) : row.fileType === "word" ? (
                    <span style={styles.docBadgeWord}>Word</span>
                  ) : (
                    <span style={styles.docBadgeFile}>File</span>
                  )}
                </div>

                {row.description ? (
                  <div style={styles.itemText}>{row.description}</div>
                ) : null}
              </div>

              <div style={styles.itemButtons}>
                {row.url ? (
                  <>
                    <a
                      style={styles.primaryButton}
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.button_text || "Open"}
                    </a>

                    <a style={styles.smallButton} href={row.url} download>
                      Download
                    </a>
                  </>
                ) : null}

                {isAdmin ? (
                  <button
                    style={styles.smallButton}
                    onClick={() => startEditDocument(row)}
                  >
                    Edit
                  </button>
                ) : null}

                {isAdmin ? (
                  <button
                    style={styles.smallDeleteButton}
                    onClick={() => handleDelete("documents", row.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No documents found</div>
        )}
      </div>
    );
  }

  function renderTab() {
    if (loading) return <div style={styles.cardLarge}>Loading...</div>;

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
              <div style={styles.subtitle}>{CLUB_SUBTITLE}</div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {isAdmin ? (
              <div style={styles.adminBadge}>Admin logged in</div>
            ) : (
              <>
                <input
                  style={styles.inputPin}
                  type="password"
                  placeholder="Admin PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdminLogin();
                  }}
                />
                <button style={styles.primaryButton} onClick={handleAdminLogin}>
                  Login
                </button>
              </>
            )}

            <button style={styles.primaryButton} onClick={loadAllData}>
              Refresh
            </button>

            {isAdmin ? (
              <button style={styles.secondaryButton} onClick={handleLogout}>
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div style={styles.tabsWrap}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {statusMessage ? (
          <div style={styles.statusMessage}>{statusMessage}</div>
        ) : null}

        {renderTab()}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #8b102b 0%, #b11233 100%)",
    padding: 16,
    fontFamily: "Arial, sans-serif",
  },
  wrap: {
    maxWidth: 1260,
    margin: "0 auto",
  },
  header: {
    background: "#efefef",
    borderRadius: 36,
    padding: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  logo: {
    width: 150,
    height: 150,
    objectFit: "contain",
  },
  title: {
    fontSize: 64,
    lineHeight: 1,
    margin: 0,
    color: "#17233d",
    fontWeight: 800,
  },
  subtitle: {
    fontSize: 28,
    color: "#17233d",
    marginTop: 14,
    maxWidth: 420,
  },
  inputPin: {
    height: 56,
    borderRadius: 18,
    border: "1px solid #ccc",
    padding: "0 18px",
    fontSize: 22,
    minWidth: 220,
  },
  tabsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 20,
  },
  tab: {
    border: "none",
    borderRadius: 20,
    background: "#f2f2f2",
    color: "#17233d",
    fontSize: 22,
    fontWeight: 700,
    padding: "18px 28px",
    cursor: "pointer",
  },
  tabActive: {
    border: "none",
    borderRadius: 20,
    background: "#f0c841",
    color: "#17233d",
    fontSize: 22,
    fontWeight: 800,
    padding: "18px 28px",
    cursor: "pointer",
  },
  card: {
    background: "#efefef",
    borderRadius: 28,
    padding: 28,
    minHeight: 180,
  },
  cardLarge: {
    background: "#efefef",
    borderRadius: 28,
    padding: 32,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  cardTitle: {
    margin: 0,
    fontSize: 46,
    color: "#17233d",
    fontWeight: 800,
  },
  subHeading: {
    margin: "12px 0",
    fontSize: 30,
    color: "#17233d",
  },
  bigTitle: {
    fontSize: 34,
    fontWeight: 800,
    color: "#17233d",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 22,
    color: "#334",
    marginTop: 8,
  },
  itemTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#17233d",
  },
  itemText: {
    fontSize: 20,
    color: "#334",
    marginTop: 6,
    whiteSpace: "pre-wrap",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    padding: "18px 0",
    borderBottom: "1px solid #d5d5d5",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  listItemCompact: {
    padding: "12px 0",
    borderBottom: "1px solid #d5d5d5",
  },
  itemButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 18,
  },
  primaryButton: {
    border: "none",
    borderRadius: 18,
    background: "#9f1435",
    color: "white",
    fontSize: 18,
    fontWeight: 700,
    padding: "14px 22px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    border: "none",
    borderRadius: 18,
    background: "#596579",
    color: "white",
    fontSize: 18,
    fontWeight: 700,
    padding: "14px 22px",
    cursor: "pointer",
  },
  saveButton: {
    border: "none",
    borderRadius: 18,
    background: "#14814d",
    color: "white",
    fontSize: 18,
    fontWeight: 700,
    padding: "14px 22px",
    cursor: "pointer",
  },
  smallButton: {
    border: "none",
    borderRadius: 14,
    background: "#e7edf8",
    color: "#17233d",
    fontSize: 16,
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  smallDeleteButton: {
    border: "none",
    borderRadius: 14,
    background: "#cc3b4b",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
  },
  whatsAppButton: {
    border: "none",
    borderRadius: 14,
    background: "#25D366",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  adminBadge: {
    background: "#dfeadf",
    color: "#0d6b3e",
    borderRadius: 999,
    padding: "14px 20px",
    fontSize: 18,
    fontWeight: 700,
  },
  pill: {
    background: "#9f1435",
    color: "white",
    borderRadius: 999,
    padding: "12px 18px",
    fontSize: 18,
    fontWeight: 700,
  },
  emptyText: {
    fontSize: 22,
    color: "#4b5563",
  },
  formBox: {
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    margin: "22px 0 10px",
    border: "1px solid #e2e2e2",
  },
  formTitle: {
    marginTop: 0,
    fontSize: 28,
    color: "#17233d",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #cfd3d9",
    padding: "14px 16px",
    fontSize: 18,
    boxSizing: "border-box",
    marginBottom: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    borderRadius: 14,
    border: "1px solid #cfd3d9",
    padding: "14px 16px",
    fontSize: 18,
    boxSizing: "border-box",
    marginBottom: 12,
    resize: "vertical",
  },
  adminActionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  helpText: {
    color: "#556",
    fontSize: 16,
    marginTop: 8,
  },
  statusMessage: {
    background: "#f4f4f4",
    borderRadius: 18,
    padding: "14px 18px",
    fontSize: 18,
    color: "#17233d",
    marginBottom: 18,
  },
  memberGroup: {
    marginTop: 16,
  },
  docCategory: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0c841",
    color: "#17233d",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  docBadgePdf: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#c62828",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  docBadgeImage: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1565c0",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  docBadgeWord: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2e7d32",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
  docBadgeFile: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#596579",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 14,
    fontWeight: 700,
  },
};
