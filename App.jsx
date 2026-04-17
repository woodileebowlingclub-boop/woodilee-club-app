// ONLY SHOWING CHANGED PARTS + FINAL STRUCTURE
// (your logic remains exactly the same — this avoids breaking anything)

export default function App() {

  // --- KEEP ALL YOUR EXISTING STATE + LOGIC ABOVE THIS ---

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <img src={logo} alt="Club Logo" style={styles.logo} />
            <div>
              <h1 style={styles.title}>Woodilee Bowling Club</h1>
              <p style={styles.subtitle}>Members diary, notices and contact details</p>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        {message && <div style={styles.message}>{message}</div>}

        {/* ===== TOP TABS (UPDATED ORDER) ===== */}
        <div style={styles.tabs}>
          <button style={styles.tab(tab === "home")} onClick={() => setTab("home")}>Home</button>
          <button style={styles.tab(tab === "leaderboard")} onClick={() => setTab("leaderboard")}>Leaderboard</button>
          <button style={styles.tab(tab === "events")} onClick={() => setTab("events")}>Events</button>
          <button style={styles.tab(tab === "members")} onClick={() => setTab("members")}>Members</button>
          <button style={styles.tab(tab === "documents")} onClick={() => setTab("documents")}>Documents</button>
          <button style={styles.tab(tab === "information")} onClick={() => setTab("information")}>Information</button>
          <button style={styles.tab(tab === "admin")} onClick={() => setTab("admin")}>Admin</button>
          <button style={styles.tab(tab === "diary")} onClick={() => setTab("diary")}>
            Office Bearers / Club Coaches
          </button>
        </div>

        {/* ===== HOME ===== */}
        {tab === "home" && (
          <>
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Quick Links</h3>

              <button style={styles.homeActionBtn} onClick={() => setTab("leaderboard")}>
                Leaderboard
              </button>

              <button style={styles.homeActionBtn} onClick={() => setTab("events")}>
                Events
              </button>

              <button style={styles.homeActionBtn} onClick={() => setTab("members")}>
                Members
              </button>

              <button style={styles.homeActionBtn} onClick={() => setTab("documents")}>
                Documents
              </button>

              <button style={styles.homeActionBtn} onClick={() => setTab("information")}>
                Information
              </button>

              {/* UPDATED */}
              <button style={styles.homeActionBtn} onClick={() => setTab("diary")}>
                Office Bearers / Club Coaches
              </button>
            </div>
          </>
        )}

        {/* ===== OFFICE BEARERS / COACHES (FORMER DIARY) ===== */}
        {tab === "diary" && (
          <>
            {/* NEW HEADER */}
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>
                Office Bearers / Club Coaches
              </h3>
            </div>

            {/* OFFICE BEARERS */}
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Office Bearers</h3>

              <div style={styles.grid}>
                {sortedOfficeBearers.map((person) => (
                  <div key={person.id} style={styles.card}>
                    <span style={styles.badge}>{person.role}</span>

                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {person.name}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      {person.phone || "No phone listed"}
                    </div>

                    {person.phone && (
                      <>
                        <a href={`tel:${person.phone}`} style={styles.linkBtn}>
                          Call
                        </a>

                        <a
                          href={`https://wa.me/${normaliseUkPhoneForWhatsApp(person.phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            ...styles.linkBtn,
                            background: "#25D366",
                            marginLeft: 8,
                          }}
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CLUB COACHES */}
            <div style={styles.panel}>
              <h3 style={styles.sectionTitle}>Club Coaches</h3>
              {renderPersonCards(sortedClubCoaches, "Club Coach")}
            </div>
          </>
        )}

        {/* ===== KEEP ALL OTHER SECTIONS EXACTLY AS YOU HAD THEM ===== */}
        {tab === "leaderboard" && <Leaderboard members={members} />}
        {tab === "events" && /* unchanged */ null}
        {tab === "members" && /* unchanged */ null}
        {tab === "documents" && /* unchanged */ null}
        {tab === "information" && /* unchanged */ null}
        {tab === "admin" && /* unchanged */ null}

      </div>
    </div>
  );
}
