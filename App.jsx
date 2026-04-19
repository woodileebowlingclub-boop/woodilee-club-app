function MondayPointsAdmin({ members = [] }) {
  const [points, setPoints] = useState(() => {
    try {
      const saved = localStorage.getItem("mondayPoints2026");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [weekSetup, setWeekSetup] = useState(() => {
    try {
      const saved = localStorage.getItem("mondayPointsWeekSetup2026");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDate, setSelectedDate] = useState(mondayDates2026[0]);
  const [playerSearch, setPlayerSearch] = useState("");

  const savePoints = (updated) => {
    setPoints(updated);
    localStorage.setItem("mondayPoints2026", JSON.stringify(updated));
  };

  const saveWeekSetup = (updated) => {
    setWeekSetup(updated);
    localStorage.setItem("mondayPointsWeekSetup2026", JSON.stringify(updated));
  };

  const currentIndex = mondayDates2026.indexOf(selectedDate);

  const previousPlayers = useMemo(() => {
    const playerSet = new Set();

    Object.keys(points).forEach((memberName) => {
      for (let i = 0; i < currentIndex; i += 1) {
        const earlierDate = mondayDates2026[i];
        if (points[memberName]?.[earlierDate] !== undefined) {
          playerSet.add(memberName);
          break;
        }
      }
    });

    return Array.from(playerSet).sort((a, b) => a.localeCompare(b, "en-GB"));
  }, [points, currentIndex]);

  useEffect(() => {
    if (!selectedDate) return;
    if (currentIndex <= 0) return;

    if (weekSetup[selectedDate]) return;

    const updatedPoints = { ...points };

    previousPlayers.forEach((memberName) => {
      if (!updatedPoints[memberName]) {
        updatedPoints[memberName] = {};
      }
      updatedPoints[memberName][selectedDate] = 0;
    });

    const updatedWeekSetup = {
      ...weekSetup,
      [selectedDate]: true,
    };

    savePoints(updatedPoints);
    saveWeekSetup(updatedWeekSetup);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayedPlayers = useMemo(() => {
    const playerSet = new Set();

    previousPlayers.forEach((name) => playerSet.add(name));

    Object.keys(points).forEach((name) => {
      if (points[name]?.[selectedDate] !== undefined) {
        playerSet.add(name);
      }
    });

    return Array.from(playerSet).sort((a, b) => a.localeCompare(b, "en-GB"));
  }, [previousPlayers, points, selectedDate]);

  const handleChange = (memberName, value) => {
    const numericValue = value === "" ? 0 : Math.max(0, Number(value));

    const updated = {
      ...points,
      [memberName]: {
        ...(points[memberName] || {}),
        [selectedDate]: numericValue,
      },
    };

    savePoints(updated);
  };

  const addPlayerToWeek = (memberName) => {
    if (!memberName) return;

    const updated = {
      ...points,
      [memberName]: {
        ...(points[memberName] || {}),
        [selectedDate]: 0,
      },
    };

    savePoints(updated);
    setPlayerSearch("");
  };

  const resetSelectedWeekToZero = () => {
    if (!window.confirm(`Reset all scores for ${selectedDate} to zero?`)) return;

    const updated = { ...points };

    displayedPlayers.forEach((memberName) => {
      if (!updated[memberName]) updated[memberName] = {};
      updated[memberName][selectedDate] = 0;
    });

    savePoints(updated);

    const updatedWeekSetup = {
      ...weekSetup,
      [selectedDate]: true,
    };
    saveWeekSetup(updatedWeekSetup);
  };

  const clearAllPoints = () => {
    if (!window.confirm("Clear all Monday night points for 2026?")) return;
    savePoints({});
    saveWeekSetup({});
  };

  const getTotal = (memberName) => {
    const memberPoints = points[memberName] || {};
    return mondayDates2026.reduce((total, date) => {
      return total + (Number(memberPoints[date]) || 0);
    }, 0);
  };

  const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const nonAssociateMembers = members
    .filter(
      (m) =>
        m?.name &&
        String(m.section || "").trim().toLowerCase() !== "associate"
    )
    .map((m) => m.name)
    .sort((a, b) => a.localeCompare(b, "en-GB"));

  const searchableMembers = nonAssociateMembers
    .filter((name) => name.toLowerCase().includes(playerSearch.toLowerCase()))
    .filter((name) => !displayedPlayers.includes(name));

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <h3 style={styles.sectionTitle}>Monday Night Points Edit – 2026</h3>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ ...styles.input, width: 240, marginBottom: 0 }}
        >
          {mondayDates2026.map((d) => (
            <option key={d} value={d}>
              {formatDiaryDate(d)}
            </option>
          ))}
        </select>

        <div>
          <button onClick={resetSelectedWeekToZero} style={styles.button}>
            Reset Selected Week To Zero
          </button>
          <button onClick={clearAllPoints} style={styles.secondaryButton}>
            Clear All Scores
          </button>
        </div>
      </div>

      <div style={styles.panel}>
        <h4 style={styles.sectionTitle}>Add Player To This Week</h4>

        <input
          type="text"
          placeholder="Search member name..."
          value={playerSearch}
          onChange={(e) => setPlayerSearch(e.target.value)}
          style={styles.input}
        />

        {playerSearch && searchableMembers.length > 0 && (
          <div>
            {searchableMembers.slice(0, 12).map((name) => (
              <div key={name} style={styles.card}>
                <strong>{name}</strong>
                <button onClick={() => addPlayerToWeek(name)} style={styles.smallBtn}>
                  Add Player
                </button>
              </div>
            ))}
          </div>
        )}

        {playerSearch && searchableMembers.length === 0 && (
          <div style={{ color: "#777" }}>No matching member found.</div>
        )}
      </div>

      <table style={styles.adminTable}>
        <thead>
          <tr>
            <th style={{ ...styles.adminTh, ...styles.stickyCol }}>Member</th>
            <th style={styles.adminTh}>{formatShortDate(selectedDate)}</th>
            <th style={styles.adminTh}>Total</th>
          </tr>
        </thead>
        <tbody>
          {displayedPlayers.length === 0 ? (
            <tr>
              <td colSpan="3" style={styles.adminTd}>
                No players yet for this week. Use search above to add one.
              </td>
            </tr>
          ) : (
            displayedPlayers.map((memberName) => (
              <tr key={memberName}>
                <td style={{ ...styles.adminTd, ...styles.stickyColBody }}>
                  {memberName}
                </td>
                <td style={styles.adminTd}>
                  <input
                    type="number"
                    min="0"
                    value={points[memberName]?.[selectedDate] ?? 0}
                    onChange={(e) => handleChange(memberName, e.target.value)}
                    style={styles.pointsInput}
                  />
                </td>
                <td style={{ ...styles.adminTd, fontWeight: 700 }}>
                  {getTotal(memberName)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
