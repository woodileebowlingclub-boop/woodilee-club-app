window.WOODILEE_CLUB_DATA = {
  "fixtures": [
    {
      "title": "Woodilee v St Rollox",
      "opponent": "St Rollox",
      "date": "2026-06-02",
      "time": "19:30",
      "team": "Woodilee"
    },
    {
      "title": "Gents Seniors",
      "opponent": "Gents Seniors",
      "date": "2026-06-03",
      "time": "14:00",
      "team": "Woodilee"
    },
    {
      "title": "Thursday Bounce",
      "opponent": "Thursday Bounce",
      "date": "2026-06-04",
      "time": "18:45",
      "team": "Woodilee"
    }
  ],
  "mondayNightPoints": [
    {
      "name": "Kenny Cook",
      "total": 17,
      "played": 6
    },
    {
      "name": "Willie Gregory",
      "total": 17,
      "played": 6
    },
    {
      "name": "Ian Whiteford",
      "total": 15,
      "played": 7
    },
    {
      "name": "Aileen Miller",
      "total": 14,
      "played": 5
    },
    {
      "name": "David Mitchell",
      "total": 14,
      "played": 7
    },
    {
      "name": "Andy Sharp",
      "total": 13,
      "played": 6
    },
    {
      "name": "Alex Maxwell",
      "total": 12,
      "played": 5
    },
    {
      "name": "Willie McIntyre",
      "total": 11,
      "played": 5
    },
    {
      "name": "Ronnie McKinnon",
      "total": 11,
      "played": 6
    },
    {
      "name": "Davie Munro",
      "total": 11,
      "played": 4
    },
    {
      "name": "Rab McLaughlin",
      "total": 10,
      "played": 4
    },
    {
      "name": "Peter Barber",
      "total": 10,
      "played": 4
    },
    {
      "name": "Adam Turner",
      "total": 10,
      "played": 4
    },
    {
      "name": "Fiona Green",
      "total": 9,
      "played": 6
    },
    {
      "name": "Ricky Irvine",
      "total": 9,
      "played": 7
    },
    {
      "name": "Frank Devlin",
      "total": 9,
      "played": 4
    },
    {
      "name": "Alan Ralston",
      "total": 6,
      "played": 3
    },
    {
      "name": "Charlie Cameron",
      "total": 6,
      "played": 2
    },
    {
      "name": "Alan Gill",
      "total": 6,
      "played": 4
    },
    {
      "name": "Ross Gregory",
      "total": 5,
      "played": 2
    },
    {
      "name": "Willie Brown",
      "total": 4,
      "played": 1
    },
    {
      "name": "Chuck Irvine",
      "total": 4,
      "played": 2
    },
    {
      "name": "Trevor Barraclough",
      "total": 3,
      "played": 1
    },
    {
      "name": "Rita Gordon",
      "total": 3,
      "played": 3
    },
    {
      "name": "Chris Moran",
      "total": 3,
      "played": 1
    },
    {
      "name": "Anne Carr",
      "total": 2,
      "played": 2
    },
    {
      "name": "Jin McDonald",
      "total": 1,
      "played": 1
    },
    {
      "name": "Karrie McDonald",
      "total": 1,
      "played": 1
    }
  ],
  "lastUpdated": "1 June 2026"
};

(function () {
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"}[char];
    });
  }

  function refreshPhoneLeaders() {
    var data = window.WOODILEE_CLUB_DATA || {};
    var players = data.mondayNightPoints || [];
    var panels = Array.prototype.slice.call(document.querySelectorAll(".phone-panel"));
    var panel = panels.find(function (item) {
      var label = item.querySelector("span");
      return label && label.textContent.trim() === "Monday Night Points";
    });

    if (!panel || !players.length) {
      return;
    }

    panel.innerHTML = '<span>Monday Night Points</span>' + players.slice(0, 3).map(function (player, index) {
      return '<div class="leader-row"><span class="rank">' + (index + 1) + '</span><span>' + escapeHtml(player.name) + '</span><strong>' + player.total + '</strong></div>';
    }).join("");
  }

  function addAverageColumn() {
    var data = window.WOODILEE_CLUB_DATA || {};
    var players = data.mondayNightPoints || [];
    var table = document.querySelector(".leader-table");
    if (!table || !players.length) {
      return;
    }

    var headRow = table.querySelector("thead tr");
    if (headRow && !headRow.querySelector('[data-average-column="true"]')) {
      var totalHead = headRow.children[2];
      var averageHead = document.createElement("th");
      averageHead.textContent = "Avg";
      averageHead.dataset.averageColumn = "true";
      averageHead.style.width = "1%";
      averageHead.style.whiteSpace = "nowrap";
      if (totalHead && totalHead.nextSibling) {
        headRow.insertBefore(averageHead, totalHead.nextSibling);
      } else {
        headRow.appendChild(averageHead);
      }
    }

    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (row, index) {
      if (row.querySelector('[data-average-column="true"]')) {
        return;
      }
      var player = players[index];
      if (!player) {
        return;
      }
      var average = player.played ? (player.total / player.played).toFixed(2) : "-";
      var averageCell = document.createElement("td");
      averageCell.textContent = average;
      averageCell.dataset.averageColumn = "true";
      averageCell.style.width = "1%";
      averageCell.style.whiteSpace = "nowrap";
      averageCell.style.fontSize = "13px";
      averageCell.style.fontWeight = "900";
      averageCell.style.color = "#64736b";
      var totalCell = row.children[2];
      if (totalCell && totalCell.nextSibling) {
        row.insertBefore(averageCell, totalCell.nextSibling);
      } else {
        row.appendChild(averageCell);
      }
    });
  }

  function addTiedLabels() {
    var data = window.WOODILEE_CLUB_DATA || {};
    var players = data.mondayNightPoints || [];
    var table = document.querySelector(".leader-table");
    if (!table || !players.length) {
      return;
    }

    var totalCounts = players.reduce(function (counts, player) {
      counts[player.total] = (counts[player.total] || 0) + 1;
      return counts;
    }, {});
    var rankByTotal = {};
    players.forEach(function (player, index) {
      if (!rankByTotal[player.total]) {
        rankByTotal[player.total] = index + 1;
      }
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

    var tieColours = [
      {"background": "#f5bc32", "color": "#0e3d2a"},
      {"background": "#dbeafe", "color": "#1e3a8a"},
      {"background": "#dcfce7", "color": "#166534"},
      {"background": "#fce7f3", "color": "#9d174d"},
      {"background": "#ede9fe", "color": "#5b21b6"},
      {"background": "#ffedd5", "color": "#9a3412"}
    ];
    var tieColourByTotal = {};
    var tieGroupIndex = 0;

    Array.prototype.forEach.call(players, function (player) {
      if (totalCounts[player.total] > 1 && !tieColourByTotal[player.total]) {
        tieColourByTotal[player.total] = tieColours[tieGroupIndex % tieColours.length];
        tieGroupIndex += 1;
      }
    });

    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (row, index) {
      var player = players[index];
      var rankCell = row.children[0];
      var nameCell = row.children[1];
      if (!player || !nameCell || totalCounts[player.total] < 2) {
        return;
      }
      if (rankCell) {
        rankCell.textContent = rankByTotal[player.total];
      }
      if (nameCell.querySelector('[data-tied-label="true"]')) {
        return;
      }

      var label = document.createElement("span");
      label.textContent = "Tied " + ordinal(rankByTotal[player.total]);
      label.dataset.tiedLabel = "true";
      label.style.display = "inline-block";
      label.style.marginLeft = "8px";
      label.style.padding = "2px 7px";
      label.style.borderRadius = "999px";
      label.style.background = tieColourByTotal[player.total].background;
      label.style.color = tieColourByTotal[player.total].color;
      label.style.fontSize = "11px";
      label.style.fontWeight = "900";
      label.style.textTransform = "uppercase";
      nameCell.appendChild(label);
    });
  }

  function updateLastUpdatedDate() {
    var data = window.WOODILEE_CLUB_DATA || {};
    var label = document.getElementById("lastUpdated");
    if (!label || !data.lastUpdated) {
      return;
    }

    label.textContent = "Last updated: " + data.lastUpdated + " - Average is total points divided by games played.";
  }

  function addWhatsAppButton() {
    if (document.querySelector('[data-whatsapp-share="true"]')) {
      return;
    }

    var actions = document.querySelector(".hero-actions");
    if (!actions) {
      return;
    }

    var shareUrl = "https://tinyurl.com/5j67nk5d";
    var message = "Woodilee Bowling Club - fixtures, Monday Night points and club links: " + shareUrl;
    var button = document.createElement("a");
    button.className = "button secondary";
    button.href = "https://wa.me/?text=" + encodeURIComponent(message);
    button.target = "_blank";
    button.rel = "noopener";
    button.dataset.whatsappShare = "true";
    button.textContent = "Share on WhatsApp";
    actions.appendChild(button);
  }

  function refreshLandingExtras() {
    refreshPhoneLeaders();
    addAverageColumn();
    addTiedLabels();
    updateLastUpdatedDate();
    addWhatsAppButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshLandingExtras);
  } else {
    refreshLandingExtras();
  }

  window.addEventListener("load", refreshLandingExtras);
}());
