  const uploadFileToBucket = async (file, folder) => {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file);

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

        if (error) return setMessage(error.message);
        setPosts((prev) => prev.map((x) => (x.id === editingPostId ? data : x)));
      } else {
        const { data, error } = await supabase
          .from("information_posts")
          .insert([payload])
          .select()
          .single();

        if (error) return setMessage(error.message);
        setPosts((prev) => [...prev, data]);
      }

      clearPostForm();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const saveDocument = async () => {
    if (!documentTitle) return setMessage("Enter document title.");

    try {
      const finalLink = documentFile
        ? await uploadFileToBucket(documentFile, "documents")
        : documentLink || null;

      const payload = {
        title: documentTitle,
        description: documentDescription,
        file_url: finalLink,
        button_text: documentButtonText,
        category: documentCategory,
      };

      if (editingDocumentId) {
        const { data, error } = await supabase
          .from("documents")
          .update(payload)
          .eq("id", editingDocumentId)
          .select()
          .single();

        if (error) return setMessage(error.message);
        setDocuments((prev) => prev.map((x) => (x.id === editingDocumentId ? data : x)));
      } else {
        const { data, error } = await supabase
          .from("documents")
          .insert([payload])
          .select()
          .single();

        if (error) return setMessage(error.message);
        setDocuments((prev) => [...prev, data]);
      }

      clearDocumentForm();
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!loggedIn) {
    return (
      <div style={styles.page}>
        <div style={styles.loginPanel}>
          <img src={logo} style={styles.logo} />
          <h1>Woodilee Bowling Club</h1>
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
          {message && <div>{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <img src={logo} style={styles.logo} />
            <div>
              <h1 style={styles.title}>Woodilee Bowling Club</h1>
              <p style={styles.subtitle}>Club App</p>
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={styles.tab(tab==="home")} onClick={()=>setTab("home")}>Home</button>
          <button style={styles.tab(tab==="leaderboard")} onClick={()=>setTab("leaderboard")}>Monday Points</button>
          <button style={styles.tab(tab==="members")} onClick={()=>setTab("members")}>Members</button>
          <button style={styles.tab(tab==="admin")} onClick={()=>setTab("admin")}>Admin</button>
        </div>

        {tab === "leaderboard" && (
          <MondayPointsLeaderboard members={members} />
        )}

        {tab === "members" && (
          <div style={styles.panel}>
            <h3>Members</h3>

            <h4>Gents</h4>
            {members.filter(m=>m.section==="Gents").map(m=>(
              <div key={m.id}>{m.name}</div>
            ))}

            <h4>Ladies</h4>
            {members.filter(m=>m.section==="Ladies").map(m=>(
              <div key={m.id}>{m.name}</div>
            ))}
          </div>
        )}

        {tab === "admin" && (
          <div style={styles.panel}>
            {!adminUnlocked ? (
              <>
                <h3>Admin Login</h3>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handleAdminLogin} style={styles.button}>
                  Enter
                </button>
              </>
            ) : (
              <>
                <h3>Monday Points Admin</h3>
                <MondayPointsAdmin members={members} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
