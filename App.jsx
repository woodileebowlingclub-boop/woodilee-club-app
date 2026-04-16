// ONLY showing the changed part to keep it clean and safe

function MondayPointsAdmin({ members = [] }) {
  const [points, setPoints] = useState(() => {
    try {
      const saved = localStorage.getItem("mondayPoints2026");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDate, setSelectedDate] = useState(mondayDates2026[0]);

  // 🔥 AUTO CARRY FORWARD LOGIC
  useEffect(() => {
    if (!selectedDate) return;

    const existingWeek = Object.values(points).some(
      (m) => m[selectedDate] !== undefined
    );

    if (existingWeek) return;

    const currentIndex = mondayDates2026.indexOf(selectedDate);
    if (currentIndex <= 0) return;

    const prevDate = mondayDates2026[currentIndex - 1];

    let updated = { ...points };

    members.forEach((m) => {
      if (!m?.name) return;

      const prevValue = updated[m.name]?.[prevDate];

      if (prevValue !== undefined) {
        updated[m.name] = {
          ...(updated[m.name] || {}),
          [selectedDate]: prevValue,
        };
      } else {
        updated[m.name] = {
          ...(updated[m.name] || {}),
          [selectedDate]: 0,
        };
      }
    });

    setPoints(updated);
    localStorage.setItem("mondayPoints2026", JSON.stringify(updated));
  }, [selectedDate, members]);

  const savePoints = (updated) => {
    setPoints(updated);
    localStorage.setItem("mondayPoints2026", JSON.stringify(updated));
  };

  const handleChange = (memberName, date, value) => {
    const numericValue = value === "" ? "" : Math.max(0, Number(value));

    const updated = {
      ...points,
      [memberName]: {
        ...(points[memberName] || {}),
        [date]: numericValue,
      },
    };

    savePoints(updated);
  };

  const clearAllPoints = () => {
    if (!window.confirm("Clear all Monday night points for 2026?")) return;
    savePoints({});
  };

  const getTotal = (memberName) => {
    const memberPoints = points[memberName] || {};
    return mondayDates2026.reduce((total, date) => {
      return total + (Number(memberPoints[date]) || 0);
    }, 0);
  };

  const sortedMembers = [...members]
    .filter((m) => m?.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "en-GB"));

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={styles.sectionTitle}>Monday Points Edit – 2026</h3>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
        >
          {mondayDates2026.map((d) => (
            <option key={d} value={d}>
              {new Date(d).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </option>
          ))}
        </select>

        <button onClick={clearAllPoints} style={styles.secondaryButton}>
          Clear All Scores
        </button>
      </div>

      <table style={styles.adminTable}>
        <thead>
          <tr>
            <th style={{ ...styles.adminTh, ...styles.stickyCol }}>Member</th>
            <th style={styles.adminTh}>Points</th>
            <th style={styles.adminTh}>Total</th>
          </tr>
        </thead>

        <tbody>
          {sortedMembers.map((member) => (
            <tr key={member.name}>
              <td style={{ ...styles.adminTd, ...styles.stickyColBody }}>
                {member.name}
              </td>

              <td style={styles.adminTd}>
                <input
                  type="number"
                  min="0"
                  value={points[member.name]?.[selectedDate] ?? 0}
                  onChange={(e) =>
                    handleChange(member.name, selectedDate, e.target.value)
                  }
                  style={styles.pointsInput}
                />
              </td>

              <td style={{ ...styles.adminTd, fontWeight: 700 }}>
                {getTotal(member.name)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}