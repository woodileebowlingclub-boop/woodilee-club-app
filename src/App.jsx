import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo.png";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";
const BUCKET = "club-files";

const styles = {
  page: {
    padding: 16,
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(180deg, #f5efe7 0%, #fffaf4 100%)",
    minHeight: "100vh",
    color: "#222",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    background: "linear-gradient(135deg, #7c2d12 0%, #b45309 100%)",
    color: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  logo: {
    width: 78,
    height: 78,
    borderRadius: "50%",
    objectFit: "cover",
    background: "#fff",
    border: "3px solid #fbbf24",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
    flexShrink: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 220,
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
    background: "#fff",
    border: "1px solid #ead7c4",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
  },
  loginPanel: {
    background: "#fff",
    border: "1px solid #ead7c4",
    borderRadius: 18,
    padding: 20,
    maxWidth: 420,
    margin: "80px auto",
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
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
    background: active ? "#b45309" : "#f3e8dc",
    color: active ? "#fff" : "#5c2c0c",
    border: active ? "1px solid #b45309" : "1px solid #e3d2c1",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
  }),
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    background: "#fffdfb",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
    background: "#fffdfb",
    fontSize: 15,
  },
  button: {
    padding: "12px 16px",
    background: "#b45309",
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
    background: "#f3e8dc",
    color: "#5c2c0c",
    border: "1px solid #e3d2c1",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8,
  },
  smallBtn: {
    padding: "8px 10px",
    background: "#eee7df",
    border: "1px solid #e3d2c1",
    borderRadius: 10,
    cursor: "pointer",
    marginLeft: 8,
    color: "#5c2c0c",
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
  card: {
    border: "1px solid #e9dfd3",
    borderRadius: 14,
    padding: 14,
    background: "#fffdfa",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 14,
  },
  sectionTitle: {
    marginTop: 0,
    color: "#7c2d12",
  },
  message: {
    marginBottom: 15,
    padding: 12,
    background: "#fff3cd",
    border: "1px solid #e0c36c",
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
  whatsappBtn: {
    display: "inline-block",
    background: "#25D366",
    color: "#fff",
    padding: "7px 10px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    marginLeft: 8,
  },
  callBtn: {
    display: "inline-block",
    background: "#2563eb",
    color: "#fff",
    padding: "7px 10px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    marginRight: 8,
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#b45309",
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 8,
    border: "1px solid #fed7aa",
  },
  pinnedCard: {
    border: "2px solid #f59e0b",
    background: "#fff7ed",
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

function sortOfficeBearers(list) {
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

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("diary");

  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [officeBearers, setOfficeBearers] = useState([]);
  const [posts, setPosts] = useState([]);

  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSection, setNewMemberSection] = useState("Gents");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  const [newRole, setNewRole] = useState("");
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");
  const [newOfficerPosition, setNewOfficerPosition] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [postDate, setPostDate] = useState("");
  const [postLink, setPostLink] = useState("");
  const [postButtonText, setPostButtonText] = useState("");
  const [postPinned, setPostPinned] = useState(false);
  const [postFile, setPostFile] = useState(null);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingOfficerId, setEditingOfficerId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  const sortedEntries = useMemo(() => sortEventsChronologically(entries), [entries]);
  const sortedPosts = useMemo(() => sortPosts(posts), [posts]);
  const sortedOfficeBearers = useMemo(
    () => sortOfficeBearers(officeBearers),
    [officeBearers]
  );

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) =>
        String(m.name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [members, search]);

  useEffect(() => {
    if (!loggedIn) return;
    loadAll();
  }, [loggedIn]);

  const loadAll = async () => {
    await Promise.all([loadEntries(), loadMembers(), loadOfficeBearers(), loadPosts()]);
  };

  const loadEntries = async () => {
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      setMessage(`Could not load diary entries: ${error.message}`);
      return;
    }
    setEntries(data || []);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase.from("members").select("*");
    if (error) {
      setMessage(`Could not load members: ${error.message}`);
      return;
    }
    setMembers(data || []);
  };

  const loadOfficeBearers = async () => {
    const { data, error } = await supabase
      .from("office_bearers")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      setMessage(`Could not load office bearers: ${error.message}`);
      return;
    }
    setOfficeBearers(data || []);
  };

  const loadPosts = async () => {
    const { data, error } = await supabase.from("information_posts").select("*");
    if (error) {
      setMessage(`Could not load information posts: ${error.message}`);
      return;
    }
    setPosts(data || []);
  };

  const handleLogin = () => {
    if (pin === CLUB_PIN) {
      setLoggedIn(true);
      setMessage("");
    } else {
      alert("Wrong PIN");
    }
  };

  const handleAdminLogin = () => {
    if (adminPin === ADMIN_PIN) {
      setAdminUnlocked(true);
      setMessage("");
    } else {
      alert("Wrong admin PIN");
    }
  };

  const clearEntryForm = () => {
    setEditingEntryId(null);
    setTitle("");
    setDate("");
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

  const saveEntry = async () => {
    if (!title || !date) {
      setMessage("Enter event title and date.");
      return;
    }

    if (editingEntryId) {
      const { data, error } = await supabase
        .from("events")
        .update({ title, date_text: date })
        .eq("id", editingEntryId)
        .select()
        .single();

      if (error) {
        setMessage(`Could not update diary entry: ${error.message}`);
        return;
      }

      setEntries((prev) => prev.map((x) => (x.id === editingEntryId ? data : x)));
      setMessage("Diary entry updated.");
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert([{ title, date_text: date, note: "" }])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save diary entry: ${error.message}`);
        return;
      }

      setEntries((prev) => [...prev, data]);
      setMessage("Diary entry added.");
    }

    clearEntryForm();
  };

  const editEntry = (entry) => {
    setEditingEntryId(entry.id);
    setTitle(entry.title || "");
    setDate(entry.date_text || "");
    setTab("admin");
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete diary entry: ${error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((x) => x.id !== id));
    setMessage("Diary entry deleted.");
  };

  const saveMember = async () => {
    if (!newMemberName) {
      setMessage("Enter member name.");
      return;
    }

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

      if (error) {
        setMessage(`Could not update member: ${error.message}`);
        return;
      }

      setMembers((prev) => prev.map((x) => (x.id === editingMemberId ? data : x)));
      setMessage("Member updated.");
    } else {
      const { data, error } = await supabase
        .from("members")
        .insert([payload])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save member: ${error.message}`);
        return;
      }

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
  };

  const deleteMember = async (id) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete member: ${error.message}`);
      return;
    }
    setMembers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Member deleted.");
  };

  const saveOfficeBearer = async () => {
    if (!newRole || !newOfficerName) {
      setMessage("Enter role and name.");
      return;
    }

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

      if (error) {
        setMessage(`Could not update office bearer: ${error.message}`);
        return;
      }

      setOfficeBearers((prev) =>
        prev.map((x) => (x.id === editingOfficerId ? data : x))
      );
      setMessage("Office bearer updated.");
    } else {
      const { data, error } = await supabase
        .from("office_bearers")
        .insert([payload])
        .select()
        .single();

      if (error) {
        setMessage(`Could not save office bearer: ${error.message}`);
        return;
      }

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
    setNewOfficerPosition(
      person.position === null || person.position === undefined
        ? ""
        : String(person.position)
    );
    setTab("admin");
  };

  const deleteOfficeBearer = async (id) => {
    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete office bearer: ${error.message}`);
      return;
    }
    setOfficeBearers((prev) => prev.filter((x) => x.id !== id));
    setMessage("Office bearer deleted.");
  };

  const moveOfficeBearer = async (id, direction) => {
    const currentList = sortOfficeBearers(officeBearers);
    const currentIndex = currentList.findIndex((person) => person.id === id);

    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const currentItem = currentList[currentIndex];
    const targetItem = currentList[targetIndex];

    const currentPos =
      Number.isFinite(Number(currentItem.position)) ? Number(currentItem.position) : currentIndex + 1;
    const targetPos =
      Number.isFinite(Number(targetItem.position)) ? Number(targetItem.position) : targetIndex + 1;

    const { error: error1 } = await supabase
      .from("office_bearers")
      .update({ position: targetPos })
      .eq("id", currentItem.id);

    if (error1) {
      setMessage(`Could not move office bearer: ${error1.message}`);
      return;
    }

    const { error: error2 } = await supabase
      .from("office_bearers")
      .update({ position: currentPos })
      .eq("id", targetItem.id);

    if (error2) {
      setMessage(`Could not move office bearer: ${error2.message}`);
      return;
    }

    setOfficeBearers((prev) =>
      prev.map((item) => {
        if (item.id === currentItem.id) return { ...item, position: targetPos };
        if (item.id === targetItem.id) return { ...item, position: currentPos };
        return item;
      })
    );

    setMessage("Office bearer order updated.");
  };

  const uploadPostFile = async () => {
    if (!postFile) return postLink || null;

    const fileExt = postFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `information/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, postFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const savePost = async () => {
    if (!postTitle || !postMessage || !postDate) {
      setMessage("Enter post title, message and date.");
      return;
    }

    try {
      const finalLink = await uploadPostFile();

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

        if (error) {
          setMessage(`Could not update information post: ${error.message}`);
          return;
        }

        setPosts((prev) => prev.map((x) => (x.id === editingPostId ? data : x)));
        setMessage("Information post updated.");
      } else {
        const { data, error } = await supabase
          .from("information_posts")
          .insert([payload])
          .select()
          .single();

        if (error) {
          setMessage(`Could not save information post: ${error.message}`);
          return;
        }

        setPosts((prev) => [...prev, data]);
        setMessage("Information post added.");
      }

      clearPostForm();
    } catch (err) {
      setMessage(`Could not save information post: ${err.message}`);
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
  };

  const deletePost = async (id) => {
    const { error } = await supabase.from("information_posts").delete().eq("id", id);
    if (error) {
      setMessage(`Could not delete information post: ${error.message}`);
      return;
    }
    setPosts((prev) => prev.filter((x) => x.id !== id));
    setMessage("Information post deleted.");
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={styles.loginPanel}>
          <img
            src={logo}
            alt="Woodilee Bowling Club"
            style={{ ...styles.logo, margin: "0 auto 12px auto" }}
          />
          <h1 style={{ ...styles.title, marginBottom: 14 }}>Woodilee Bowling Club</h1>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin} style={styles.button}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <img src={logo} alt="Woodilee Bowling Club" style={styles.logo} />
          <div style={styles.titleWrap}>
            <h1 style={styles.title}>Woodilee Bowling Club</h1>
            <p style={styles.subtitle}>Members diary, notices and contact details</p>
          </div>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.tabs}>
          <button style={styles.tab(tab === "diary")} onClick={() => setTab("diary")}>
            Diary
          </button>
          <button style={styles.tab(tab === "members")} onClick={() => setTab("members")}>
            Members
          </button>
          <button
            style={styles.tab(tab === "information")}
            onClick={() => setTab("information")}
          >
            Information
          </button>
          <button style={styles.tab(tab === "admin")} onClick={() => setTab("admin")}>
            Admin
          </button>
        </div>

        {tab === "diary" && (
          <>
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Office Bearers</h3>
              <div style={styles.grid}>
                {sortedOfficeBearers.map((person) => (
                  <div key={person.id} style={styles.card}>
                    <span style={styles.badge}>
                      {person.role}
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                      {person.name}
                    </div>
                    <div style={{ marginBottom: 10, color: "#444" }}>
                      {person.phone || "No phone listed"}
                    </div>

                    {person.phone ? (
                      <div>
                        <a href={`tel:${person.phone}`} style={styles.callBtn}>
                          📞 Call
                        </a>
                        <a
                          href={`https://wa.me/${normaliseUkPhoneForWhatsApp(person.phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.whatsappBtn}
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
              <h3 style={styles.sectionTitle}>Diary Events</h3>
              {sortedEntries.map((e) => (
                <div key={e.id} style={styles.card}>
                  <strong style={{ color: "#92400e" }}>{e.date_text}</strong> — {e.title}
                </div>
              ))}
            </div>
          </>
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

            {filteredMembers.map((m) => (
              <div key={m.id} style={styles.card}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{m.name}</div>
                <div style={{ color: "#92400e", marginTop: 4 }}>{m.section}</div>
                <div style={{ marginTop: 10 }}>
                  {m.phone ? (
                    <>
                      <a href={`tel:${m.phone}`} style={styles.callBtn}>
                        📞 {m.phone}
                      </a>
                      <a
                        href={`https://wa.me/${normaliseUkPhoneForWhatsApp(m.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.whatsappBtn}
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : (
                    <span style={{ color: "#888" }}>No phone</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "information" && (
          <div style={styles.panel}>
            <h3 style={styles.sectionTitle}>General Information</h3>
            {sortedPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  ...styles.card,
                  ...(post.pinned ? styles.pinnedCard : {}),
                }}
              >
                {post.pinned ? <div style={styles.badge}>📌 Pinned Notice</div> : null}
                <div style={{ color: "#92400e", fontWeight: 700 }}>{post.date_posted}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
                  {post.title}
                </div>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{post.message}</div>
                {post.attachment_link ? (
                  <a
                    href={post.attachment_link}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.linkBtn}
                  >
                    {post.button_text || "Open Attachment"}
                  </a>
                ) : null}
              </div>
            ))}
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
                <button onClick={handleAdminLogin} style={styles.button}>
                  Enter
                </button>
              </div>
            ) : (
              <>
                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>
                    {editingEntryId ? "Edit Diary Entry" : "Add Diary Entry"}
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
                  <button onClick={saveEntry} style={styles.button}>
                    {editingEntryId ? "Update Diary Entry" : "Save Diary Entry"}
                  </button>
                  {(editingEntryId || title || date) && (
                    <button onClick={clearEntryForm} style={styles.secondaryButton}>
                      Clear
                    </button>
                  )}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>Manage Diary Entries</h3>
                  {sortedEntries.map((e) => (
                    <div key={e.id} style={styles.card}>
                      <strong>{e.date_text}</strong> — {e.title}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editEntry(e)} style={styles.smallBtn}>
                          Edit
                        </button>
                        <button onClick={() => deleteEntry(e.id)} style={styles.smallBtn}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>
                    {editingOfficerId ? "Edit Office Bearer" : "Add Office Bearer"}
                  </h3>
                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Role"
                    style={styles.input}
                  />
                  <input
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    placeholder="Name"
                    style={styles.input}
                  />
                  <input
                    value={newOfficerPhone}
                    onChange={(e) => setNewOfficerPhone(e.target.value)}
                    placeholder="Phone"
                    style={styles.input}
                  />
                  <input
                    type="number"
                    value={newOfficerPosition}
                    onChange={(e) => setNewOfficerPosition(e.target.value)}
                    placeholder="Position order e.g. 1, 2, 3"
                    style={styles.input}
                  />
                  <button onClick={saveOfficeBearer} style={styles.button}>
                    {editingOfficerId ? "Update Office Bearer" : "Save Office Bearer"}
                  </button>
                  {(editingOfficerId ||
                    newRole ||
                    newOfficerName ||
                    newOfficerPhone ||
                    newOfficerPosition) && (
                    <button onClick={clearOfficerForm} style={styles.secondaryButton}>
                      Clear
                    </button>
                  )}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>Manage Office Bearers</h3>
                  {sortedOfficeBearers.map((person, index) => (
                    <div key={person.id} style={styles.card}>
                      <strong>{person.role}</strong> — {person.name}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editOfficeBearer(person)} style={styles.smallBtn}>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteOfficeBearer(person.id)}
                          style={styles.smallBtn}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => moveOfficeBearer(person.id, "up")}
                          style={styles.reorderBtn}
                          disabled={index === 0}
                        >
                          ↑ Up
                        </button>
                        <button
                          onClick={() => moveOfficeBearer(person.id, "down")}
                          style={styles.reorderBtn}
                          disabled={index === sortedOfficeBearers.length - 1}
                        >
                          ↓ Down
                        </button>
                      </div>
                      <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                        Position: {person.position ?? "not set"}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>
                    {editingMemberId ? "Edit Member" : "Add Member"}
                  </h3>
                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    style={styles.input}
                  />
                  <select
                    value={newMemberSection}
                    onChange={(e) => setNewMemberSection(e.target.value)}
                    style={styles.input}
                  >
                    <option>Gents</option>
                    <option>Ladies</option>
                    <option>Associate</option>
                  </select>
                  <input
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="Phone"
                    style={styles.input}
                  />
                  <button onClick={saveMember} style={styles.button}>
                    {editingMemberId ? "Update Member" : "Save Member"}
                  </button>
                  {(editingMemberId || newMemberName || newMemberPhone) && (
                    <button onClick={clearMemberForm} style={styles.secondaryButton}>
                      Clear
                    </button>
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
                          <button onClick={() => editMember(m)} style={styles.smallBtn}>
                            Edit
                          </button>
                          <button onClick={() => deleteMember(m.id)} style={styles.smallBtn}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>
                    {editingPostId ? "Edit Information Post" : "Add Information Post"}
                  </h3>
                  <input
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Title"
                    style={styles.input}
                  />
                  <textarea
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                    placeholder="Message"
                    style={styles.textarea}
                  />
                  <input
                    type="date"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    style={styles.input}
                  />
                  <input
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder="Attachment link"
                    style={styles.input}
                  />
                  <input
                    value={postButtonText}
                    onChange={(e) => setPostButtonText(e.target.value)}
                    placeholder="Button text e.g. Download Form"
                    style={styles.input}
                  />
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                      Upload file
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setPostFile(e.target.files?.[0] || null)}
                    />
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
                  {(editingPostId ||
                    postTitle ||
                    postMessage ||
                    postDate ||
                    postLink ||
                    postButtonText ||
                    postPinned ||
                    postFile) && (
                    <button onClick={clearPostForm} style={styles.secondaryButton}>
                      Clear
                    </button>
                  )}
                </div>

                <div style={styles.panel}>
                  <h3 style={styles.sectionTitle}>Manage Information Posts</h3>
                  {sortedPosts.map((post) => (
                    <div key={post.id} style={styles.card}>
                      <strong>{post.date_posted}</strong> — {post.title} {post.pinned ? "• PINNED" : ""}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => editPost(post)} style={styles.smallBtn}>
                          Edit
                        </button>
                        <button onClick={() => deletePost(post.id)} style={styles.smallBtn}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}