window.WOODILEE_CLUB_DATA = {
  "fixtures": [
    { "title": "Woodilee v St Rollox", "opponent": "St Rollox", "date": "2026-06-02", "time": "19:30", "team": "Woodilee" },
    { "title": "Gents Seniors", "opponent": "Gents Seniors", "date": "2026-06-03", "time": "14:00", "team": "Woodilee" },
    { "title": "Thursday Bounce", "opponent": "Thursday Bounce", "date": "2026-06-04", "time": "18:45", "team": "Woodilee" }
  ],
  "mondayNightPoints": [
    { "name": "Kenny Cook", "total": 21, "played": 7 },
    { "name": "Aileen Miller", "total": 18, "played": 6 },
    { "name": "David Mitchell", "total": 17, "played": 8 },
    { "name": "Willie Gregory", "total": 17, "played": 6 },
    { "name": "Ian Whiteford", "total": 16, "played": 8 },
    { "name": "Frank Devlin", "total": 13, "played": 5 },
    { "name": "Andy Sharp", "total": 13, "played": 6 },
    { "name": "Alex Maxwell", "total": 12, "played": 5 },
    { "name": "Ronnie McKinnon", "total": 12, "played": 7 },
    { "name": "Willie McIntyre", "total": 11, "played": 5 },
    { "name": "Adam Turner", "total": 11, "played": 5 },
    { "name": "Davie Munro", "total": 11, "played": 4 },
    { "name": "Rab McLaughlin", "total": 10, "played": 4 },
    { "name": "Peter Barber", "total": 10, "played": 4 },
    { "name": "Ricky Irvine", "total": 10, "played": 8 },
    { "name": "Fiona Green", "total": 9, "played": 6 },
    { "name": "Alan Gill", "total": 9, "played": 5 },
    { "name": "Alan Ralston", "total": 6, "played": 3 },
    { "name": "Charlie Cameron", "total": 6, "played": 2 },
    { "name": "Ross Gregory", "total": 5, "played": 2 },
    { "name": "Chuck Irvine", "total": 5, "played": 3 },
    { "name": "Willie Brown", "total": 4, "played": 1 },
    { "name": "Trevor Barraclough", "total": 3, "played": 1 },
    { "name": "Rita Gordon", "total": 3, "played": 3 },
    { "name": "Chris Moran", "total": 3, "played": 1 },
    { "name": "Anne Carr", "total": 2, "played": 2 },
    { "name": "Jin McDonald", "total": 1, "played": 1 },
    { "name": "Karrie McDonald", "total": 1, "played": 1 }
  ],
  "lastUpdated": "8 June 2026"
};

(function () {
  function addAverageColumn(players, table) {
    var headRow = table.querySelector("thead tr");
    if (headRow && !headRow.querySelector('[data-average-column="true"]')) {
      var th = document.createElement("th");
      th.textContent = "Avg";
      th.dataset.averageColumn = "true";
      var totalHead = headRow.children[2];
      totalHead && totalHead.nextSibling ? headRow.insertBefore(th, totalHead.nextSibling) : headRow.appendChild(th);
    }
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (row, index) {
      if (row.querySelector('[data-average-column="true"]')) return;
      var player = players[index];
      if (!player) return;
      var td = document.createElement("td");
      td.textContent = player.played ? (player.total / player.played).toFixed(2) : "-";
      td.dataset.averageColumn = "true";
      td.style.fontSize = "13px";
      td.style.fontWeight = "900";
      td.style.color = "#64736b";
      var totalCell = row.children[2];
      totalCell && totalCell.nextSibling ? row.insertBefore(td, totalCell.nextSibling) : row.appendChild(td);
    });
  }

  function addTies(players, table) {
    var counts = {}, rankByTotal = {}, colours = [["#f5bc32", "#0e3d2a"], ["#dbeafe", "#1e3a8a"], ["#dcfce7", "#166534"], ["#fce7f3", "#9d174d"], ["#ede9fe", "#5b21b6"], ["#ffedd5", "#9a3412"]], colourByTotal = {}, group = 0;
    players.forEach(function (player, index) {
      counts[player.total] = (counts[player.total] || 0) + 1;
      if (!rankByTotal[player.total]) rankByTotal[player.total] = index + 1;
    });
    players.forEach(function (player) {
      if (counts[player.total] > 1 && !colourByTotal[player.total]) colourByTotal[player.total] = colours[group++ % colours.length];
    });
    function ordinal(value) {
      var suffix = "th";
      if (value % 100 < 11 || value % 100 > 13) {
        if (value % 10 === 1) suffix = "st";
        if (value % 10 === 2) suffix = "nd";
        if (value % 10 === 3) suffix = "rd";
      }
      return value + suffix;
    }
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (row, index) {
      var player = players[index], rank = row.children[0], name = row.children[1];
      if (!player || !name || counts[player.total] < 2) return;
      if (rank) rank.textContent = rankByTotal[player.total];
      if (name.querySelector('[data-tied-label="true"]')) return;
      var colour = colourByTotal[player.total], label = document.createElement("span");
      label.textContent = "Tied " + ordinal(rankByTotal[player.total]);
      label.dataset.tiedLabel = "true";
      label.style.cssText = "display:inline-block;margin-left:8px;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:900;text-transform:uppercase;background:" + colour[0] + ";color:" + colour[1];
      name.appendChild(label);
    });
  }

  function applyLandingExtras() {
    var data = window.WOODILEE_CLUB_DATA || {}, players = data.mondayNightPoints || [];
    var style = document.querySelector('[data-woodilee-soft-theme="true"]') || document.createElement("style");
    if (!style.dataset.woodileeSoftTheme) {
      style.dataset.woodileeSoftTheme = "true";
      style.textContent = "body{background:#f1f8ed}.site-header{background:rgba(241,248,237,.96)!important;border-bottom:4px solid #b5221f}.hero{color:#16221b!important;background:linear-gradient(90deg,rgba(241,248,237,.98),rgba(241,248,237,.88)),linear-gradient(135deg,#f2faee,#d5ebca 48%,#e9f5e3)!important}.hero-inner{grid-template-columns:1fr!important}.app-card,.quick-facts,.club-band,.snapshot-side{display:none!important}.live-snapshot{grid-template-columns:1fr!important}.button.primary{background:#f5bc32!important;color:#1c2c24!important}.hero .button.secondary,.nav .button.secondary{color:#24352d!important;background:rgba(255,255,255,.72)!important;border-color:rgba(36,53,45,.22)!important}.snapshot-panel{border-top:5px solid #f5bc32}.leader-table{font-size:14px!important}.leader-table th,.leader-table td{padding:11px 13px!important}.leader-table tr.podium td{background:#fff3c4!important}.cta{background:linear-gradient(90deg,rgba(36,53,45,.94),rgba(181,34,31,.88))!important}";
      document.head.appendChild(style);
    }

    var visitLink = document.querySelector('.nav-links a[href="#visit"]');
    if (visitLink) {
      visitLink.href = "#contact";
      visitLink.textContent = "Contact";
    }
    var headline = document.querySelector("h1");
    if (headline) headline.textContent = "Woodilee Bowling Club";
    var copy = document.querySelector(".hero-copy");
    if (copy) copy.textContent = "Fixtures, club information, member links and Monday points.";
    var actions = document.querySelector(".hero-actions");
    if (actions && !document.querySelector('[data-scores-jump="true"]')) {
      var scoreButton = document.createElement("a");
      scoreButton.className = "button secondary";
      scoreButton.href = "#monday-scores";
      scoreButton.dataset.scoresJump = "true";
      scoreButton.textContent = "Monday scores";
      actions.appendChild(scoreButton);
    }
    if (actions && !document.querySelector('[data-whatsapp-share="true"]')) {
      var share = document.createElement("a");
      share.className = "button secondary";
      share.href = "https://wa.me/?text=" + encodeURIComponent("Woodilee Bowling Club - Monday Night points and club links: https://tinyurl.com/5j67nk5d");
      share.target = "_blank";
      share.rel = "noopener";
      share.dataset.whatsappShare = "true";
      share.textContent = "Share on WhatsApp";
      actions.appendChild(share);
    }

    var panel = document.querySelector(".snapshot-panel");
    if (panel) {
      panel.id = "monday-scores";
      var title = panel.querySelector("h2");
      if (title) title.textContent = "Monday Night players and scores";
    }
    var table = document.querySelector(".leader-table");
    if (table && players.length) {
      addAverageColumn(players, table);
      addTies(players, table);
    }

    var side = document.querySelector(".snapshot-side");
    if (side && !document.querySelector('[data-world-cup-special="true"]')) {
      var card = document.createElement("article");
      card.className = "info-card";
      card.dataset.worldCupSpecial = "true";
      card.style.borderTop = "5px solid #b5221f";
      card.innerHTML = '<span>Club event</span><h3>World Cup Special</h3><p>Open the club app for World Cup Special details.</p><a class="button primary" href="https://woodilee-club-app-v4hu.vercel.app/">Open World Cup Special</a>';
      side.insertBefore(card, side.firstChild);
    }
    var updated = document.getElementById("lastUpdated");
    if (updated && data.lastUpdated) updated.textContent = "Last updated: " + data.lastUpdated + " - Average is total points divided by games played.";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyLandingExtras); else applyLandingExtras();
  window.addEventListener("load", applyLandingExtras);
}());
