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
  ]
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshPhoneLeaders);
  } else {
    refreshPhoneLeaders();
  }

  window.addEventListener("load", refreshPhoneLeaders);
}());
