import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo.png";

const CLUB_PIN = "1911";
const ADMIN_PIN = "1954";

const SECTION_KEYS = ["section1", "section2", "section3"];

function sortByPosition(list) {
  return [...list].sort((a, b) => (a.position || 999) - (b.position || 999));
}

export default function App() {
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);

  const [officeBearers, setOfficeBearers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);

  const loadData = async () => {
    const ob = await supabase.from("office_bearers").select("*");
    setOfficeBearers(ob.data || []);

    const cc = await supabase.from("club_coaches").select("*");
    setCoaches(cc.data || []);

    const ds = await supabase.from("diary_sections").select("*");
    setSections(ds.data || []);

    const si = await supabase.from("diary_section_items").select("*");
    setSectionItems(si.data || []);
  };

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  const getSectionTitle = (key) => {
    return sections.find((s) => s.section_key === key)?.title || key;
  };

  const getItems = (key) => {
    return sortByPosition(sectionItems.filter((i) => i.section_key === key));
  };

  const move = async (table, items, setFn, id, dir) => {
    const list = sortByPosition(items);
    const index = list.findIndex((i) => i.id === id);
    const swap = dir === "up" ? index - 1 : index + 1;

    if (swap < 0 || swap >= list.length) return;

    const a = list[index];
    const b = list[swap];

    await supabase.from(table).update({ position: b.position }).eq("id", a.id);
    await supabase.from(table).update({ position: a.position }).eq("id", b.id);

    loadData();
  };

  if (!loggedIn) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <img src={logo} style={{ width: 100 }} />
        <h1>Woodilee Bowling Club</h1>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <br />
        <button onClick={() => setLoggedIn(pin === CLUB_PIN)}>Enter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <img src={logo} style={{ width: 80 }} />
      <h1>Woodilee Bowling Club</h1>

      {!admin && (
        <button onClick={() => setAdmin(prompt("Admin PIN") === ADMIN_PIN)}>
          Admin Login
        </button>
      )}

      <h2>Office Bearers</h2>
      {sortByPosition(officeBearers).map((p, i) => (
        <div key={p.id}>
          {p.role} — {p.name}
          {admin && (
            <>
              <button onClick={() => move("office_bearers", officeBearers, setOfficeBearers, p.id, "up")}>↑</button>
              <button onClick={() => move("office_bearers", officeBearers, setOfficeBearers, p.id, "down")}>↓</button>
            </>
          )}
        </div>
      ))}

      <h2>Club Coaches</h2>
      {sortByPosition(coaches).map((c) => (
        <div key={c.id}>
          {c.name}
          {admin && (
            <>
              <button onClick={() => move("club_coaches", coaches, setCoaches, c.id, "up")}>↑</button>
              <button onClick={() => move("club_coaches", coaches, setCoaches, c.id, "down")}>↓</button>
            </>
          )}
        </div>
      ))}

      {SECTION_KEYS.map((key) => (
        <div key={key}>
          <h2>{getSectionTitle(key)}</h2>
          {getItems(key).map((item) => (
            <div key={item.id}>
              {item.name}
              {admin && (
                <>
                  <button onClick={() => move("diary_section_items", getItems(key), setSectionItems, item.id, "up")}>↑</button>
                  <button onClick={() => move("diary_section_items", getItems(key), setSectionItems, item.id, "down")}>↓</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}