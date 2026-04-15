import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";
const BUCKET = "club-files";

const styles = {
  page: {
    padding: 16,
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(180deg, #5b1d2a 0%, #7a2638 45%, #a33a4d 100%)",
    minHeight: "100vh",
    color: "#222",
  },
  wrap: {
    maxWidth: 1150,
    margin: "0 auto",
  },
  header: {
    background: "linear-gradient(135deg, #5a1323 0%, #7b1e32 55%, #a12f45 100%)",
    color: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "6px 0 0 0",
    opacity: 0.95,
    fontSize: 15,
  },
  panel: {
    background: "#fffaf8",
    border: "1px solid #e5c8cf",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  loginPanel: {
    background: "#fffaf8",
    border: "1px solid #e5c8cf",
    borderRadius: 18,
    padding: 20,
    maxWidth: 420,
    margin: "80px auto",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  tab: (active) => ({
    padding: "12px 16px",
    background: active ? "#8b1e3f" : "#f3d9df",
    color: active ? "#fff" : "#5b1d2a",
    border: active ? "1px solid #8b1e3f" : "1px solid #e5c8cf",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
  }),
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #d7b7be",
    boxSizing: "border-box",
    background: "#fffefe",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #d7b7be",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
    background: "#fffefe",
    fontSize: 15,
  },
  button: {
    padding: "12px 16px",
    background: "#8b1e3f",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8,
  },
  secondaryButton: {
    padding: "12px 16px",
    background: "#f3d9df",
    color: "#5b1d2a",
    border: "1px solid #e5c8cf",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8,
  },
  smallBtn: {
    padding: "8px 10px",
    background: "#f2e4e7",
    border: "1px solid #e0c5cb",
    borderRadius: 10,
    cursor: "pointer",
    marginLeft: 8,
    color: "#5b1d2a",
    fontWeight: 700,
  },
  reorderBtn: {
    padding: "8px 10px",
    background: "#dbeafe",
    border: "1px solid #93c5fd",
    borderRadius: 10,
    cursor: "pointer",
    marginLeft: 8,
    color: "#1d4ed8",
    fontWeight: 700,
  },
  disabledReorderBtn: {
    padding: "8px 10px",
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    cursor: "not-allowed",
    marginLeft: 8,
    color: "#9ca3af",
    fontWeight: 700,
  },
  card: {
    border: "1px solid #ead7dc",
    borderRadius: 14,
    padding: 14,
    background: "#fffdfd",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 14,
  },
  sectionTitle: {
    marginTop: 0,
    color: "#7a2138",
  },
  memberSectionTitle: {
    color: "#7a2138",
    borderBottom: "2px solid #efd6dc",
    paddingBottom: 6,
    marginTop: 22,
    marginBottom: 12,
  },
  message: {
    marginBottom: 15,
    padding: 12,
    background: "#fff1c7",
    border: "1px solid #e6c768",
    borderRadius: 10,
  },
  linkBtn: {
    display: "inline-block",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
    marginTop: 10,
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fff1e8",
    color: "#9a3412",
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 8,
    border: "1px solid #fdba74",
  },
  pinnedCard: {
    border: "2px solid #f59e0b",
    background: "#fff7ed",
  },
  fileInfo: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  heroCard: {
    background: "linear-gradient(135deg, #fff7ed 0%, #fde7d3 100%)",
    border: "2px solid #f59e0b",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
  },
  heroTitle: {
    margin: "0 0 8px 0",
    color: "#9a3412",
    fontSize: 24,
    fontWeight: 700,
  },
  heroDate: {
    fontSize: 18,
    fontWeight: 700,
    color: "#7c2d12",
    marginBottom: 8,
  },
  homeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  homeActionBtn: {
    display: "inline-block",
    padding: "12px 16px",
    background: "#8b1e3f",
    color: "#fff",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 700,
    marginRight: 10,
    marginBottom: 10,
    cursor: "pointer",
    border: "none",
  },
  homeMiniCard: {
    border: "1px solid #ead7dc",
    borderRadius: 14,
    padding: 14,
    background: "#fffdfd",
    minHeight: 150,
  },
  homeLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#9a3412",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
};

function sortEventsChronologically(list) {
  return [...list].sort(
    (a, b) => new Date(a.date_text).getTime() - new Date(b.date_text).getTime()
  );
}

function sortPosts(list) {
  return [...list].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime();
  });
}

function sortMondayPoints(list) {
  return [...list].sort(
    (a, b) => new Date(b.week_date).getTime() - new Date(a.week_date).getTime()
  );
}

function sortByPositionThenName(list) {
  return [...list].sort((a, b) => {
    const aPos = Number.isFinite(Number(a.position)) ? Number(a.position) : 999;
    const bPos = Number.isFinite(Number(b.position)) ? Number(b.position) : 999;
    if (aPos !== bPos) return aPos - bPos;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function normaliseUkPhoneForWhatsApp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("44")) return digits;
  if (digits.startsWith("0")) return `44${digits.slice(1)}`;
  return digits;
}

function formatDiaryDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFileTypeLabel(url) {
  const lower = String(url || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".png")) return "PNG image";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPEG image";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) return "Excel file";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "Word document";
  return "Attachment";
}

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("home");

  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [adminTab, setAdminTab] = useState("events");

  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [clubCoaches, setClubCoaches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [mondayPoints, setMondayPoints] = useState([]);

  const [search, setSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [infoSearch, setInfoSearch] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSection, setNewMemberSection] = useState("Gents");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  const [newRole, setNewRole] = useState("");
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");
  const [newOfficerPosition, setNewOfficerPosition] = useState("");

  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachPhone, setNewCoachPhone] = useState("");
  const [newCoachPosition, setNewCoachPosition] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [postDate, setPostDate] = useState("");
  const [postLink, setPostLink] = useState("");
  const [postButtonText, setPostButtonText] = useState("");
  const [postPinned, setPostPinned] = useState(false);
  const [postFile, setPostFile] = useState(null);

  const [mondayTitle, setMondayTitle] = useState("");
  const [mondayDate, setMondayDate] = useState("");
  const [mondayNote, setMondayNote] = useState("");
  const [mondayButtonText, setMondayButtonText] = useState("");
  const [mondayLink, setMondayLink] = useState("");
  const [mondayFile, setMondayFile] = useState(null);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingOfficerId, setEditingOfficerId] = useState(null);
  const [editingCoachId, setEditingCoachId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingMondayId, setEditingMondayId] = useState(null);

  const sortedEntries = useMemo(() => sortEventsChronologically(entries), [entries]);
  const sortedPosts = useMemo(() => sortPosts(posts), [posts]);
  const sortedMondayPoints = useMemo(() => sortMondayPoints(mondayPoints), [mondayPoints]);
  const sortedOfficeBearers = useMemo(
    () => sortByPositionThenName(officeBearers),
    [officeBearers]
  );
  const sortedClubCoaches = useMemo(
    () => sortByPositionThenName(clubCoaches),
    [clubCoaches]
  );

  const filteredEvents = useMemo(() => {
    return sortedEntries.filter((e) => {
      const q = eventSearch.toLowerCase();
      return (
        String(e.title || "").toLowerCase().includes(q) ||
        String(e.note || "").toLowerCase().includes(q) ||
        String(formatDiaryDate(e.date_text) || "").toLowerCase().includes(q)
      );
    });
  }, [sortedEntries, eventSearch]);

  const filteredPosts = useMemo(() => {
    return sortedPosts.filter((post) => {
      const q = infoSearch.toLowerCase();
      return (
        String(post.title || "").toLowerCase().includes(q) ||
        String(post.message || "").toLowerCase().includes(q) ||
        String(post.date_posted || "").toLowerCase().includes(q)
      );
    });
  }, [sortedPosts, infoSearch]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      String(m.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  const gentsMembers = useMemo(
    () =>
      filteredMembers
        .filter((m) => String(m.section || "").trim().toLowerCase() === "gents")
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [filteredMembers]
  );

  const ladiesMembers = useMemo(
    () =>
      filteredMembers
        .filter((m) => String(m.section || "").trim().toLowerCase() === "ladies")
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [filteredMembers]
  );

  const associateMembers = useMemo(
    () =>
      filteredMembers
        .filter((m) => String(m.section || "").trim().toLowerCase() === "associate")
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
    [filteredMembers]
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sortedEntries.filter((e) => {
      const d = new Date(e.date_text);
      return !Number.isNaN(d.getTime()) && d >= today;
    });
  }, [sortedEntries]);

  const nextEvent = useMemo(() => upcomingEvents[0] || null, [upcomingEvents]);
  const nextTwoEvents = useMemo(() => upcomingEvents.slice(1, 3), [upcomingEvents]);
  const latestMonday = useMemo(() => sortedMondayPoints[0] || null, [sortedMondayPoints]);
  const latestPinnedPost = useMemo(() => {
    return sortedPosts.find((p) => p.pinned) || null;
  }, [sortedPosts]);

  useEffect(() => {
    if (!loggedIn) return;
    loadAll();
  }, [loggedIn]);

  const loadAll = async () => {
    await Promise.all([
      loadEntries(),
      loadMembers(),
      loadOfficeBearers(),
      loadClubCoaches(),
      loadPosts(),
      loadMondayPoints(),
    ]);
  };

  const loadEntries = async () => {
    const { data, error } = await supabase.from("events").select("*");
    if (error) return setMessage(`Could not load events: ${error.message}`);
    setEntries(data || []);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase.from("members").select("*");
    if (error) return setMessage(`Could not load members: ${error.message}`);
    setMembers(data || []);
  };

  const loadOfficeBearers = async () => {
    const { data, error } = await supabase
      .from("office_bearers")
      .select("*")
      .order("position", { ascending: true });

    if (error) return setMessage(`Could not load office bearers: ${error.message}`);
    setOfficeBearers(data || []);
  };

  const loadClubCoaches = async () => {
    const { data, error } = await supabase
      .from("club_coaches")
      .select("*")
      .order("position", { ascending: true });

    if (error) return setMessage(`Could not load club coaches: ${error.message}`);
    setClubCoaches(data || []);
  };

  const loadPosts = async () => {
    const { data, error } = await supabase.from("information_posts").select("*");
    if (error) return setMessage(`Could not load information posts: ${error.message}`);
    setPosts(data || []);
  };

  const loadMondayPoints = async () => {
    const { data, error } = await supabase.from("monday_points").select("*");
    if (error) return setMessage(`Could not load Monday Points: ${error.message}`);
    setMondayPoints(data || []);
  };

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
      setMessage("");
    } else {
      setMessage("Incorrect club PIN.");
    }
  };

  const handleAdminLogin = () => {
    if (adminPin === ADMIN_PIN) {
      setAdminUnlocked(true);
      setMessage("");
    } else {
      setMessage("Incorrect admin PIN.");
    }
  };

  const clearEntryForm = () => {
    setEditingEntryId(null);
    setTitle("");
    setDate("");
    setNote("");
  };

  const clearMemberForm = () => {
    setEditingMemberId(null);
    setNewMemberName("");
    setNewMemberSection("Gents");
    setNewMemberPhone("");
  };

  const clearOfficerForm = () => {
    setEditingOfficerId(null);
    setNewRole("");
    setNewOfficerName("");
    setNewOfficerPhone("");
    setNewOfficerPosition("");
  };

  const clearCoachForm = () => {
    setEditingCoachId(null);
    setNewCoachName("");
    setNewCoachPhone("");
    setNewCoachPosition("");
  };

  const clearPostForm = () => {
    setEditingPostId(null);
    setPostTitle("");
    setPostMessage("");
    setPostDate("");
    setPostLink("");
    setPostButtonText("");
    setPostPinned(false);
    setPostFile(null);
  };

  const clearMondayForm = () => {
    setEditingMondayId(null);
    setMondayTitle("");
    setMondayDate("");
    setMondayNote("");
    setMondayButtonText("");
    setMondayLink("");
    setMondayFile(null);
  };

  const saveEntry = async () => {
    if (!title || !date) return setMessage("Enter event title and date.");

    if (editingEntryId) {
      const { data, error } = await supabase
        .from("events")
        .update({ title, date_text: date, note })
        .eq("id", editingEntryId)
        .select()
        .single();

      if (error) return setMessage(`Could not update event: ${error.message}`);
      setEntries((prev) => prev.map((x) => (x.id === editingEntryId ? data : x)));
      setMessage("Event updated.");
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert([{ title, date_text: date, note }])
        .select()
        .single();

      if (error) return setMessage(`Could not save event: ${error.message}`);
      setEntries((prev) => [...prev, data]);
      setMessage("Event added.");
    }

    clearEntryForm();
  };

  const editEntry = (entry) => {
    setEditingEntryId(entry.id);
    setTitle(entry.title || "");
    setDate(entry.date_text || "");
    setNote(entry.note || "");
    setTab("admin");
    setAdminTab("events");
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return setMessage(`Could not delete event: ${error.message}`);
    setEntries((prev) => prev.filter((x) => x.id !== id));
    setMessage("Event deleted.");
  };

  const saveMember = async () => {
    if (!newMemberName) return setMessage("Enter member name.");

    const payload = {
      name: newMemberName,
      section: newMemberSection,
      phone: newMemberPhone,
    };

    if (editingMemberId) {
      const { data, error } = await supabase
        .from("members")
        .update(payload)
        .eq("id", editingMemberId)
        .select()
        .single();

      if (error) return setMessage(`Could not update member: ${error.message}`);
      setMembers((prev) => prev.map((x) => (x.id === editingMemberId ? data : x)));
      setMessage("Member updated.");
    } else {
      const { data, error } = await supabase
        .from("members")
        .insert([payload])
        .select()
        .single();

      if (error) return setMessage(`Could not save member: ${error.message}`);
      setMembers((prev) => [...prev, data]);
      setMessage("Member added.");
    }

    clearMemberForm();
  };

  const editMember = (member) => {
    setEditingMemberId(member.id);
    setNewMemberName(member.name || "");
    setNewMemberSection(member.section || "Gents");
    setNewMemberPhone(member.phone || "");
    setTab("admin");
    setAdminTab("members");
  };

  const deleteMember = async (id) => {
    if (!window.confirm("Delete this member?")) return;

    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return setMessage(`Could not delete member: ${error.message}`);
    setMembers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Member deleted.");
  };

  const saveOfficeBearer = async () => {
    if (!newRole || !newOfficerName) return setMessage("Enter role and name.");

    const payload = {
      role: newRole,
      name: newOfficerName,
      phone: newOfficerPhone,
      position: newOfficerPosition === "" ? null : Number(newOfficerPosition),
    };

    if (editingOfficerId) {
      const { data, error } = await supabase
        .from("office_bearers")
        .update(payload)
        .eq("id", editingOfficerId)
        .select()
        .single();

      if (error) return setMessage(`Could not update office bearer: ${error.message}`);
      setOfficeBearers((prev) => prev.map((x) => (x.id === editingOfficerId ? data : x)));
      setMessage("Office bearer updated.");
    } else {
      const { data, error } = await supabase
        .from("office_bearers")
        .insert([payload])
        .select()
        .single();

      if (error) return setMessage(`Could not save office bearer: ${error.message}`);
      setOfficeBearers((prev) => [...prev, data]);
      setMessage("Office bearer added.");
    }

    clearOfficerForm();
  };

  const editOfficeBearer = (person) => {
    setEditingOfficerId(person.id);
    setNewRole(person.role || "");
    setNewOfficerName(person.name || "");
    setNewOfficerPhone(person.phone || "");
    setNewOfficerPosition(person.position == null ? "" : String(person.position));
    setTab("admin");
    setAdminTab("officers");
  };

  const deleteOfficeBearer = async (id) => {
    if (!window.confirm("Delete this office bearer?")) return;

    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) return setMessage(`Could not delete office bearer: ${error.message}`);
    setOfficeBearers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Office bearer deleted.");
  };

  const saveCoach = async () => {
    if (!newCoachName) return setMessage("Enter coach name.");

    const payload = {
      name: newCoachName,
      phone: newCoachPhone,
      position: newCoachPosition === "" ? null : Number(newCoachPosition),
    };

    if (editingCoachId) {
      const { data, error } = await supabase
        .from("club_coaches")
        .update(payload)
        .eq("id", editingCoachId)
        .select()
        .single();

      if (error) return setMessage(`Could not update club coach: ${error.message}`);
      setClubCoaches((prev) => prev.map((x) => (x.id === editingCoachId ? data : x)));
      setMessage("Club coach updated.");
    } else {
      const { data, error } = await supabase
        .from("club_coaches")
        .insert([payload])
        .select()
        .single();

      if (error) return setMessage(`Could not save club coach: ${error.message}`);
      setClubCoaches((prev) => [...prev, data]);
      setMessage("Club coach added.");
    }

    clearCoachForm();
  };

  const editCoach = (coach) => {
    setEditingCoachId(coach.id);
    setNewCoachName(coach.name || "");
    setNewCoachPhone(coach.phone || "");
    setNewCoachPosition(coach.position == null ? "" : String(coach.position));
    setTab("admin");
    setAdminTab("coaches");
  };

  const deleteCoach = async (id) => {
    if (!window.confirm("Delete this club coach?")) return;

    const { error } = await supabase.from("club_coaches").delete().eq("id", id);
    if (error) return setMessage(`Could not delete club coach: ${error.message}`);
    setClubCoaches((prev) => prev.filter((x) => x.id !== id));
    setMessage("Club coach deleted.");
  };

  const uploadFileToBucket = async (file, folder) => {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const savePost = async () => {
    if (!postTitle || !postMessage || !postDate) {
      return setMessage("Enter post title, message and date.");
    }

    try {
      const finalLink = postFile
        ? await uploadFileToBucket(postFile, "information")
        : postLink || null;

      const payload = {
        title: postTitle,
        message: postMessage,
        date_posted: postDate,
        attachment_link: finalLink,
        button_text: postButtonText || null,
        pinned: postPinned,
      };

      if (editingPostId) {
        const { data, error } = await supabase
          .from("information_posts")
          .update(payload)
          .eq("id", editingPostId)
          .select()
          .single();

        if (error) return setMessage(`Could not update information post: ${error.message}`);
        setPosts((prev) => prev.map((x) => (x.id === editingPostId ? data : x)));
        setMessage("Information post updated.");
      } else {
        const { data, error } = await supabase
          .from("information_posts")
          .insert([payload])
          .select()
          .single();

        if (error) return setMessage(`Could not save information post: ${error.message}`);
        setPosts((prev) => [...prev, data]);
        setMessage("Information post added.");
      }

      clearPostForm();
    } catch (err) {
      setMessage(`Could not upload file: ${err.message}`);
    }
  };

  const editPost = (post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title || "");
    setPostMessage(post.message || "");
    setPostDate(post.date_posted || "");
    setPostLink(post.attachment_link || "");
    setPostButtonText(post.button_text || "");
    setPostPinned(!!post.pinned);
    setPostFile(null);
    setTab("admin");
    setAdminTab("info");
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this information post?")) return;

    const { error } = await supabase.from("information_posts").delete().eq("id", id);
    if (error) return setMessage(`Could not delete information post: ${error.message}`);
    setPosts((prev) => prev.filter((x) => x.id !== id));
    setMessage("Information post deleted.");
  };

  const saveMondayPoints = async () => {
    if (!mondayTitle || !mondayDate) {
      return setMessage("Enter Monday Points title and week date.");
    }

    try {
      const finalLink = mondayFile
        ? await uploadFileToBucket(mondayFile, "monday-points")
        : mondayLink || null;

      const payload = {
        title: mondayTitle,
        week_date: mondayDate,
        note: mondayNote || null,
        file_url: finalLink,
        button_text: mondayButtonText || null,
      };

      if (editingMondayId) {
        const { data, error } = await supabase
          .from("monday_points")
          .update(payload)
          .eq("id", editingMondayId)
          .select()
          .single();

        if (error) return setMessage(`Could not update Monday Points: ${error.message}`);
        setMondayPoints((prev) => prev.map((x) => (x.id === editingMondayId ? data : x)));
        setMessage("Monday Points updated.");
      } else {
        const { data, error } = await supabase
          .from("monday_points")
          .insert([payload])
          .select()
          .single();

        if (error) return setMessage(`Could not save Monday Points: ${error.message}`);
        setMondayPoints((prev) => [...prev, data]);
        setMessage("Monday Points added.");
      }

      clearMondayForm();
    } catch (err) {
      setMessage(`Could not upload Monday Points file: ${err.message}`);
    }
  };

  const editMondayPoints = (item) => {
    setEditingMondayId(item.id);
    setMondayTitle(item.title || "");
    setMondayDate(item.week_date || "");
    setMondayNote(item.note || "");
    setMondayButtonText(item.button_text || "");
    setMondayLink(item.file_url || "");
    setMondayFile(null);
    setTab("admin");
    setAdminTab("monday");
  };

  const deleteMondayPoints = async (id) => {
    if (!window.confirm("Delete this Monday Points item?")) return;

    const { error } = await supabase.from("monday_points").delete().eq("id", id);
    if (error) return setMessage(`Could not delete Monday Points: ${error.message}`);
    setMondayPoints((prev) => prev.filter((x) => x.id !== id));
    setMessage("Monday Points deleted.");
  };

  const moveItem = async (table, items, onItemsUpdated, id, direction, label) => {
    const currentList = sortByPositionThenName(items);
    const currentIndex = currentList.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const currentItem = currentList[currentIndex];
    const targetItem = currentList[targetIndex];

    const currentPos = Number.isFinite(Number(currentItem.position))
      ? Number(currentItem.position)
      : currentIndex + 1;

    const targetPos = Number.isFinite(Number(targetItem.position))
      ? Number(targetItem.position)
      : targetIndex + 1;

    const { error: error1 } = await supabase
      .from(table)
      .update({ position: targetPos })
      .eq("id", currentItem.id);

    if (error1) return setMessage(`Could not move ${label}: ${error1.message}`);

    const { error: error2 } = await supabase
      .from(table)
      .update({ position: currentPos })
      .eq("id", targetItem.id);

    if (error2) return setMessage(`Could not move ${label}: ${error2.message}`);

    const updatedList = items.map((item) => {
      if (item.id === currentItem.id) return { ...item, position: targetPos };
      if (item.id === targetItem.id) return { ...item, position: currentPos };
      return item;
    });

    onItemsUpdated(updatedList);
    setMessage(`${label} order updated.`);
  };

  const renderMemberCards = (list) => {
    if (list.length === 0) {
      return <div style={{ color: "#777", marginBottom: 12 }}>No members in this section.</div>;
    }

    return list.map((m) => (
      <div key={m.id} style={styles.card}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{m.name}</div>
        <div style={{ color: "#92400e", marginTop: 4 }}>{m.section}</div>
        <div style={{ marginTop: 10 }}>
          {m.phone ? (
            <>
              <a href={`tel:${m.phone}`} style={styles.linkBtn}>Call</a>
              <a
                href={`https://wa.me/${normaliseUkPhoneForWhatsApp(m.phone)}`}
                target="_blank"
                rel="noreferrer"
                style={{ ...styles.linkBtn, background: "#25D366", marginLeft: 8 }}
              >
                WhatsApp
              </a>
            </>
          ) : (
            <span style={{ color: "#888" }}>No phone</span>
          )}
        </div>
      </div>
    ));
  };

  const renderPersonCards = (list, badgeText) => {
    if (list.length === 0) return <div style={{ color: "#777" }}>No entries yet.</div>;

    return (
      <div style={styles.grid}>
        {list.map((person) => (
          <div key={person.id} style={styles.card}>
            <span style={styles.badge}>{badgeText}</span>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{person.name}</div>
            <div style={{ marginBottom: 10, color: "#444" }}>
              {person.phone || "No phone listed"}
            </div>
            {person.phone ? (
              <div>
                <a href={`tel:${person.phone}`} style={styles.linkBtn}>Call</a>
                <a
                  href={`https://wa.me/${normaliseUkPhoneForWhatsApp(person.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...styles.linkBtn, background: "#25D366", marginLeft: 8 }}
                >
                  WhatsApp
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={styles.loginPanel}>
          <h1 style={{ ...styles.title, marginBottom: 14 }}>Woodilee Bowling Club</h1>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.button}>Enter</button>
          {message ? (
            <div style={{ marginTop: 8, color: "#8b1e3f", fontWeight: 700 }}>
              {message}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <h1 style={styles.title}>Woodilee Bowling Club</h1>
          <p style={styles.subtitle}>Members diary, notices and contact details</p>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.tabs}>
          <button style={styles.tab(tab === "home")} onClick={() => setTab("home")}>Home</button>
          <button style={styles.tab(tab === "diary")} onClick={() => setTab("diary")}>Diary</button>
          <button style={styles.tab(tab === "events")} onClick={() => setTab("events")}>Events</button>
          <button style={styles.tab(tab === "members")} onClick={() => setTab("members")}>Members</button>
          <button style={styles.tab(tab === "information")} onClick={() => setTab("information")}>Information</button>
          <button style={styles.tab(tab === "admin")} onClick={() => setTab("admin")}>Admin</button>
        </div>

        {tab === "home" && (
          <>
            <div style={styles.heroCard}>
              <div style={styles.homeLabel}>Next Club Event</div>

              {nextEvent ? (
                <>
                  <div style={styles.heroTitle}>{nextEvent.title}</div>
                  <div style={styles.heroDate}>{formatDiaryDate(nextEvent.date_text)}</div>
                  {nextEvent.note ? (
                    <div style={{ color: "#444", whiteSpace: "pre-wrap", marginBottom: 12 }}>
                      {nextEvent.note}
                    </div>
                  ) : null}

                  <div>
                    <button style={styles.homeActionBtn} onClick={() => setTab("events")}>
                      View All Events
                    </button>
                    <button style={styles.homeActionBtn} onClick={() => setTab("information")}>
                      Club Notices
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.heroTitle}>No upcoming events</div>
                  <div style={{ color: "#555" }}>Add events in Admin to show them here.</div>
                </>
              )}
            </div>

            <div style={styles.homeGrid}>
              <div style={styles.homeMiniCard}>
                <div style={styles.homeLabel}>Latest Monday Points</div>

                {latestMonday ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                      {latestMonday.title}
                    </div>
                    <div style={{ color: "#92400e", fontWeight: 700, marginBottom: 8 }}>
                      {formatDiaryDate(latestMonday.week_date)}
                    </div>
                    {latestMonday.note ? (
                      <div style={{ color: "#555", whiteSpace: "pre-wrap", marginBottom: 10 }}>
                        {latestMonday.note}
                      </div>
                    ) : null}
                    {latestMonday.file_url ? (
                      <a
                        href={latestMonday.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkBtn}
                      >
                        {latestMonday.button_text || "Open Monday Points"}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <div style={{ color: "#777" }}>No Monday Points uploaded yet.</div>
                )}
              </div>

              <div style={styles.homeMiniCard}>
                <div style={styles.homeLabel}>Pinned Notice</div>

                {latestPinnedPost ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                      {latestPinnedPost.title}
                    </div>
                    <div style={{ color: "#555", whiteSpace: "pre-wrap", marginBottom: 10 }}>
                      {latestPinnedPost.message}
                    </div>
                    {latestPinnedPost.attachment_link ? (
                      <a
                        href={latestPinnedPost.attachment_link}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkBtn}
                      >
                        {latestPinnedPost.button_text || "Open Notice"}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <div style={{ color: "#777" }}>No pinned notice.</div>
                )}
              </div>

              <div style={styles.homeMiniCard}>
                <div style={styles.homeLabel}>Coming Up</div>

                {nextTwoEvents.length > 0 ? (
                  nextTwoEvents.map((e) => (
                    <div key={e.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700 }}>{e.title}</div>
                      <div style={{ color: "#92400e" }}>{formatDiaryDate(e.date_text)}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#777" }}>No further upcoming events.</div>
                )}
              </div>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Quick Links</h3>
              <button style={styles.homeActionBtn} onClick={() => setTab("diary")}>
                Diary
              </button>
              <button style={styles.homeActionBtn} onClick={() => setTab("events")}>
                Events
              </button>
              <button style={styles.homeActionBtn} onClick={() => setTab("members")}>
                Members
              </button>
              <button style={styles.homeActionBtn} onClick={() => setTab("information")}>
                Information
              </button>
            </div>
          </>
        )}

        {tab === "diary" && (
          <>
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Office Bearers</h3>
              <div style={styles.grid}>
                {sortedOfficeBearers.map((person) => (
                  <div key={person.id} style={styles.card}>
                    <span style={styles.badge}>{person.role}</span>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                      {person.name}
                    </div>
                    <div style={{ marginBottom: 10, color: "#444" }}>
                      {person.phone || "No phone listed"}
                    </div>
                    {person.phone ? (
                      <div>
                        <a href={`tel:${person.phone}`} style={styles.linkBtn}>Call</a>
                        <a
                          href={`https://wa.me/${normaliseUkPhoneForWhatsApp(person.phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ ...styles.linkBtn, background: "#25D366", marginLeft: 8 }}
                        >
                          WhatsApp
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Club Coaches</h3>
              {renderPersonCards(sortedClubCoaches, "Club Coach")}
            </div>

            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Monday Points</h3>
              {sortedMondayPoints.length === 0 ? (
                <div style={{ color: "#777" }}>No Monday Points uploaded yet.</div>
              ) : (
                sortedMondayPoints.map((item) => (
                  <div key={item.id} style={styles.card}>
                    <strong style={{ color: "#92400e" }}>{formatDiaryDate(item.week_date)}</strong> — {item.title}
                    {item.note ? (
                      <div style={{ marginTop: 8, color: "#555", whiteSpace: "pre-wrap" }}>
                        {item.note}
                      </div>
                    ) : null}
                    {item.file_url ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={styles.fileInfo}>{getFileTypeLabel(item.file_url)}</div>
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.linkBtn}
                        >
                          {item.button_text || "Open Monday Points"}
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "events" && (
          <div style={styles.panel}>
            <h3 style={styles.sectionTitle}>Events</h3>

            <input
              type="text"
              placeholder="Search events..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              style={styles.input}
            />

            {filteredEvents.length === 0 ? (
              <div style={{ color: "#777" }}>No matching events found.</div>
            ) : (
              filteredEvents.map((e) => (
                <div key={e.id} style={styles.card}>
                  <strong style={{ color: "#92400e" }}>{formatDiaryDate(e.date_text)}</strong> — {e.title}
                  {e.note ? (
                    <div style={{ marginTop: 8, color: "#555", whiteSpace: "pre-wrap" }}>
                      {e.note}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "members" && (
          <div style={styles.panel}>
            <h3 style={styles.sectionTitle}>Members</h3>
            <input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />

            <h4 style={styles.memberSectionTitle}>Gents</h4>
            {renderMemberCards(gentsMembers)}

            <h4 style={styles.memberSectionTitle}>Ladies</h4>
            {renderMemberCards(ladiesMembers)}

            <h4 style={styles.memberSectionTitle}>Associate</h4>
            {renderMemberCards(associateMembers)}
          </div>
        )}

        {tab === "information" && (
          <div style={styles.panel}>
            <h3 style={styles.sectionTitle}>General Information</h3>

            <input
              type="text"
              placeholder="Search information..."
              value={infoSearch}
              onChange={(e) => setInfoSearch(e.target.value)}
              style={styles.input}
            />

            {filteredPosts.length === 0 ? (
              <div style={{ color: "#777" }}>No matching information found.</div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  style={{ ...styles.card, ...(post.pinned ? styles.pinnedCard : {}) }}
                >
                  {post.pinned ? <div style={styles.badge}>📌 Pinned Notice</div> : null}
                  <div style={{ color: "#92400e", fontWeight: 700 }}>{post.date_posted}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{post.title}</div>
                  <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{post.message}</div>

                  {post.attachment_link ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={styles.fileInfo}>{getFileTypeLabel(post.attachment_link)}</div>
                      <a
                        href={post.attachment_link}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkBtn}
                      >
                        {post.button_text || "Open Attachment"}
                      </a>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "admin" && (
          <div>
            {!adminUnlocked ? (
              <div style={{ ...styles.panel, maxWidth: 420 }}>
                <h3 style={styles.sectionTitle}>Admin Login</h3>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handleAdminLogin} style={styles.button}>Enter</button>
              </div>
            ) : (
              <>
                <div style={styles.tabs}>
                  <button onClick={() => setAdminTab("events")} style={styles.tab(adminTab === "events")}>
                    Events
                  </button>
                  <button onClick={() => setAdminTab("monday")} style={styles.tab(adminTab === "monday")}>
                    Monday Points
                  </button>
                  <button onClick={() => setAdminTab("officers")} style={styles.tab(adminTab === "officers")}>
                    Office Bearers
                  </button>
                  <button onClick={() => setAdminTab("coaches")} style={styles.tab(adminTab === "coaches")}>
                    Coaches
                  </button>
                  <button onClick={() => setAdminTab("members")} style={styles.tab(adminTab === "members")}>
                    Members
                  </button>
                  <button onClick={() => setAdminTab("info")} style={styles.tab(adminTab === "info")}>
                    Information
                  </button>
                </div>

                {adminTab === "events" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>
                        {editingEntryId ? "Edit Event" : "Add Event"}
                      </h3>

                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event title"
                        style={styles.input}
                      />

                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={styles.input}
                      />

                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note"
                        style={styles.textarea}
                      />

                      <button onClick={saveEntry} style={styles.button}>
                        {editingEntryId ? "Update Event" : "Save Event"}
                      </button>

                      {(editingEntryId || title || date || note) && (
                        <button onClick={clearEntryForm} style={styles.secondaryButton}>
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Events</h3>
                      {sortedEntries.map((e) => (
                        <div key={e.id} style={styles.card}>
                          <strong>{formatDiaryDate(e.date_text)}</strong> — {e.title}
                          {e.note ? (
                            <div style={{ marginTop: 8, color: "#555", whiteSpace: "pre-wrap" }}>
                              {e.note}
                            </div>
                          ) : null}
                          <div style={{ marginTop: 8 }}>
                            <button onClick={() => editEntry(e)} style={styles.smallBtn}>Edit</button>
                            <button onClick={() => deleteEntry(e.id)} style={styles.smallBtn}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {adminTab === "monday" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>
                        {editingMondayId ? "Edit Monday Points" : "Add Monday Points"}
                      </h3>

                      <input
                        value={mondayTitle}
                        onChange={(e) => setMondayTitle(e.target.value)}
                        placeholder="Title e.g. Monday Points Week 1"
                        style={styles.input}
                      />

                      <input
                        type="date"
                        value={mondayDate}
                        onChange={(e) => setMondayDate(e.target.value)}
                        style={styles.input}
                      />

                      <textarea
                        value={mondayNote}
                        onChange={(e) => setMondayNote(e.target.value)}
                        placeholder="Optional note"
                        style={styles.textarea}
                      />

                      <input
                        value={mondayLink}
                        onChange={(e) => setMondayLink(e.target.value)}
                        placeholder="Attachment link (optional if uploading file)"
                        style={styles.input}
                      />

                      <input
                        value={mondayButtonText}
                        onChange={(e) => setMondayButtonText(e.target.value)}
                        placeholder="Button text"
                        style={styles.input}
                      />

                      <div style={{ marginBottom: 10 }}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx,application/pdf,image/png,image/jpeg,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setMondayFile(e.target.files?.[0] || null)}
                        />
                        {mondayFile ? (
                          <div style={styles.fileInfo}>Selected file: {mondayFile.name}</div>
                        ) : null}
                      </div>

                      <button onClick={saveMondayPoints} style={styles.button}>
                        {editingMondayId ? "Update Monday Points" : "Save Monday Points"}
                      </button>

                      {(editingMondayId || mondayTitle || mondayDate || mondayNote || mondayLink || mondayButtonText || mondayFile) && (
                        <button onClick={clearMondayForm} style={styles.secondaryButton}>
                          Clear
                        </button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Monday Points</h3>
                      {sortedMondayPoints.length === 0 ? (
                        <div style={{ color: "#777" }}>No Monday Points yet.</div>
                      ) : (
                        sortedMondayPoints.map((item) => (
                          <div key={item.id} style={styles.card}>
                            <strong>{formatDiaryDate(item.week_date)}</strong> — {item.title}
                            {item.file_url ? (
                              <div style={{ marginTop: 6, color: "#666" }}>
                                {getFileTypeLabel(item.file_url)}
                              </div>
                            ) : null}
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => editMondayPoints(item)} style={styles.smallBtn}>Edit</button>
                              <button onClick={() => deleteMondayPoints(item.id)} style={styles.smallBtn}>Delete</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {adminTab === "officers" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>
                        {editingOfficerId ? "Edit Office Bearer" : "Add Office Bearer"}
                      </h3>
                      <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role" style={styles.input} />
                      <input value={newOfficerName} onChange={(e) => setNewOfficerName(e.target.value)} placeholder="Name" style={styles.input} />
                      <input value={newOfficerPhone} onChange={(e) => setNewOfficerPhone(e.target.value)} placeholder="Phone" style={styles.input} />
                      <input
                        type="number"
                        value={newOfficerPosition}
                        onChange={(e) => setNewOfficerPosition(e.target.value)}
                        placeholder="Position order"
                        style={styles.input}
                      />
                      <button onClick={saveOfficeBearer} style={styles.button}>
                        {editingOfficerId ? "Update Office Bearer" : "Save Office Bearer"}
                      </button>
                      {(editingOfficerId || newRole || newOfficerName || newOfficerPhone || newOfficerPosition) && (
                        <button onClick={clearOfficerForm} style={styles.secondaryButton}>Clear</button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Office Bearers</h3>
                      {sortedOfficeBearers.map((person, index) => {
                        const canMoveUp = index > 0;
                        const canMoveDown = index < sortedOfficeBearers.length - 1;

                        return (
                          <div key={person.id} style={styles.card}>
                            <strong>{person.role}</strong> — {person.name}
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => editOfficeBearer(person)} style={styles.smallBtn}>Edit</button>
                              <button onClick={() => deleteOfficeBearer(person.id)} style={styles.smallBtn}>Delete</button>
                              <button
                                onClick={() =>
                                  canMoveUp &&
                                  moveItem(
                                    "office_bearers",
                                    officeBearers,
                                    (updated) => setOfficeBearers(updated),
                                    person.id,
                                    "up",
                                    "Office bearer"
                                  )
                                }
                                style={canMoveUp ? styles.reorderBtn : styles.disabledReorderBtn}
                                type="button"
                              >
                                ↑ Up
                              </button>
                              <button
                                onClick={() =>
                                  canMoveDown &&
                                  moveItem(
                                    "office_bearers",
                                    officeBearers,
                                    (updated) => setOfficeBearers(updated),
                                    person.id,
                                    "down",
                                    "Office bearer"
                                  )
                                }
                                style={canMoveDown ? styles.reorderBtn : styles.disabledReorderBtn}
                                type="button"
                              >
                                ↓ Down
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {adminTab === "coaches" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>
                        {editingCoachId ? "Edit Club Coach" : "Add Club Coach"}
                      </h3>
                      <input value={newCoachName} onChange={(e) => setNewCoachName(e.target.value)} placeholder="Name" style={styles.input} />
                      <input value={newCoachPhone} onChange={(e) => setNewCoachPhone(e.target.value)} placeholder="Phone" style={styles.input} />
                      <input
                        type="number"
                        value={newCoachPosition}
                        onChange={(e) => setNewCoachPosition(e.target.value)}
                        placeholder="Position order"
                        style={styles.input}
                      />
                      <button onClick={saveCoach} style={styles.button}>
                        {editingCoachId ? "Update Club Coach" : "Save Club Coach"}
                      </button>
                      {(editingCoachId || newCoachName || newCoachPhone || newCoachPosition) && (
                        <button onClick={clearCoachForm} style={styles.secondaryButton}>Clear</button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Club Coaches</h3>
                      {sortedClubCoaches.map((coach, index) => {
                        const canMoveUp = index > 0;
                        const canMoveDown = index < sortedClubCoaches.length - 1;

                        return (
                          <div key={coach.id} style={styles.card}>
                            <strong>{coach.name}</strong> — {coach.phone || "no phone"}
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => editCoach(coach)} style={styles.smallBtn}>Edit</button>
                              <button onClick={() => deleteCoach(coach.id)} style={styles.smallBtn}>Delete</button>
                              <button
                                onClick={() =>
                                  canMoveUp &&
                                  moveItem(
                                    "club_coaches",
                                    clubCoaches,
                                    (updated) => setClubCoaches(updated),
                                    coach.id,
                                    "up",
                                    "Club coach"
                                  )
                                }
                                style={canMoveUp ? styles.reorderBtn : styles.disabledReorderBtn}
                                type="button"
                              >
                                ↑ Up
                              </button>
                              <button
                                onClick={() =>
                                  canMoveDown &&
                                  moveItem(
                                    "club_coaches",
                                    clubCoaches,
                                    (updated) => setClubCoaches(updated),
                                    coach.id,
                                    "down",
                                    "Club coach"
                                  )
                                }
                                style={canMoveDown ? styles.reorderBtn : styles.disabledReorderBtn}
                                type="button"
                              >
                                ↓ Down
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {adminTab === "members" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>{editingMemberId ? "Edit Member" : "Add Member"}</h3>
                      <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name" style={styles.input} />
                      <select value={newMemberSection} onChange={(e) => setNewMemberSection(e.target.value)} style={styles.input}>
                        <option>Gents</option>
                        <option>Ladies</option>
                        <option>Associate</option>
                      </select>
                      <input value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="Phone" style={styles.input} />
                      <button onClick={saveMember} style={styles.button}>
                        {editingMemberId ? "Update Member" : "Save Member"}
                      </button>
                      {(editingMemberId || newMemberName || newMemberPhone) && (
                        <button onClick={clearMemberForm} style={styles.secondaryButton}>Clear</button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Members</h3>
                      {members
                        .slice()
                        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                        .map((m) => (
                          <div key={m.id} style={styles.card}>
                            <strong>{m.name}</strong> — {m.section} — {m.phone || "no phone"}
                            <div style={{ marginTop: 8 }}>
                              <button onClick={() => editMember(m)} style={styles.smallBtn}>Edit</button>
                              <button onClick={() => deleteMember(m.id)} style={styles.smallBtn}>Delete</button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {adminTab === "info" && (
                  <>
                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>
                        {editingPostId ? "Edit Information Post" : "Add Information Post"}
                      </h3>
                      <input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Title" style={styles.input} />
                      <textarea value={postMessage} onChange={(e) => setPostMessage(e.target.value)} placeholder="Message" style={styles.textarea} />
                      <input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)} style={styles.input} />
                      <input value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="Attachment link (optional if uploading file)" style={styles.input} />
                      <input value={postButtonText} onChange={(e) => setPostButtonText(e.target.value)} placeholder="Button text" style={styles.input} />

                      <div style={{ marginBottom: 10 }}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx,application/pdf,image/png,image/jpeg,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setPostFile(e.target.files?.[0] || null)}
                        />
                        {postFile ? (
                          <div style={styles.fileInfo}>Selected file: {postFile.name}</div>
                        ) : null}
                      </div>

                      <label style={{ display: "block", marginBottom: 10 }}>
                        <input
                          type="checkbox"
                          checked={postPinned}
                          onChange={(e) => setPostPinned(e.target.checked)}
                          style={{ marginRight: 8 }}
                        />
                        Pin this post to the top
                      </label>

                      <button onClick={savePost} style={styles.button}>
                        {editingPostId ? "Update Information Post" : "Save Information Post"}
                      </button>

                      {(editingPostId || postTitle || postMessage || postDate || postLink || postButtonText || postPinned || postFile) && (
                        <button onClick={clearPostForm} style={styles.secondaryButton}>Clear</button>
                      )}
                    </div>

                    <div style={styles.panel}>
                      <h3 style={styles.sectionTitle}>Manage Information Posts</h3>
                      {sortedPosts.map((post) => (
                        <div key={post.id} style={styles.card}>
                          <strong>{post.date_posted}</strong> — {post.title} {post.pinned ? "• PINNED" : ""}
                          {post.attachment_link ? (
                            <div style={{ marginTop: 6, color: "#666" }}>
                              {getFileTypeLabel(post.attachment_link)}
                            </div>
                          ) : null}
                          <div style={{ marginTop: 8 }}>
                            <button onClick={() => editPost(post)} style={styles.smallBtn}>Edit</button>
                            <button onClick={() => deletePost(post.id)} style={styles.smallBtn}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}