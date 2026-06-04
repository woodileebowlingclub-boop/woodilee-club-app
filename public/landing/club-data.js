window.WOODILEE_CLUB_DATA = {
  fixtures: [
    { title: 'Woodilee v St Rollox', opponent: 'St Rollox', date: '2026-06-02', time: '19:30', team: 'Woodilee' },
    { title: 'Gents Seniors', opponent: 'Gents Seniors', date: '2026-06-03', time: '14:00', team: 'Woodilee' },
    { title: 'Thursday Bounce', opponent: 'Thursday Bounce', date: '2026-06-04', time: '18:45', team: 'Woodilee' }
  ],
  mondayNightPoints: [
    { name: 'Kenny Cook', total: 17, played: 6 },
    { name: 'Willie Gregory', total: 17, played: 6 },
    { name: 'Ian Whiteford', total: 15, played: 7 },
    { name: 'Aileen Miller', total: 14, played: 5 },
    { name: 'David Mitchell', total: 14, played: 7 },
    { name: 'Andy Sharp', total: 13, played: 6 },
    { name: 'Alex Maxwell', total: 12, played: 5 },
    { name: 'Willie McIntyre', total: 11, played: 5 },
    { name: 'Ronnie McKinnon', total: 11, played: 6 },
    { name: 'Davie Munro', total: 11, played: 4 },
    { name: 'Rab McLaughlin', total: 10, played: 4 },
    { name: 'Peter Barber', total: 10, played: 4 },
    { name: 'Adam Turner', total: 10, played: 4 },
    { name: 'Fiona Green', total: 9, played: 6 },
    { name: 'Ricky Irvine', total: 9, played: 7 },
    { name: 'Frank Devlin', total: 9, played: 4 },
    { name: 'Alan Ralston', total: 6, played: 3 },
    { name: 'Charlie Cameron', total: 6, played: 2 },
    { name: 'Alan Gill', total: 6, played: 4 },
    { name: 'Ross Gregory', total: 5, played: 2 },
    { name: 'Willie Brown', total: 4, played: 1 },
    { name: 'Chuck Irvine', total: 4, played: 2 },
    { name: 'Trevor Barraclough', total: 3, played: 1 },
    { name: 'Rita Gordon', total: 3, played: 3 },
    { name: 'Chris Moran', total: 3, played: 1 },
    { name: 'Anne Carr', total: 2, played: 2 },
    { name: 'Jin McDonald', total: 1, played: 1 },
    { name: 'Karrie McDonald', total: 1, played: 1 }
  ],
  lastUpdated: '1 June 2026'
};

(function () {
  var flyerUrl = 'https://uwffpthxiostuqlnuqhl.supabase.co/storage/v1/object/public/club-files/world-cup-special/woodilee-world-cup-special-flyer.png';
  var trackerUrl = 'https://uwffpthxiostuqlnuqhl.supabase.co/storage/v1/object/public/club-files/world-cup-special/woodilee-world-cup-special-tracker.xlsx';

  function addStyles() {
    if (document.querySelector('[data-world-cup-special-style=true]')) return;
    var style = document.createElement('style');
    style.dataset.worldCupSpecialStyle = 'true';
    style.textContent = '.world-cup-special{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:48px 0 20px}.world-cup-panel{display:grid;grid-template-columns:minmax(240px,.75fr) minmax(0,1.25fr);gap:24px;align-items:center;border:1px solid var(--line);border-radius:8px;background:#fff;box-shadow:var(--shadow);padding:24px}.world-cup-poster{width:100%;max-width:390px;border-radius:8px;border:1px solid var(--line);box-shadow:0 16px 42px rgba(36,53,45,.16)}.world-cup-copy h2{margin:0 0 12px;font-size:clamp(30px,4vw,46px);line-height:1.05;color:#16221b}.world-cup-copy p{margin:0 0 16px;color:#64736b;font-size:17px;line-height:1.55}.world-cup-rule-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.world-cup-rule-grid span{display:block;padding:12px;border-radius:8px;background:#f9fcf5;border:1px solid var(--line);font-weight:900;color:#24352d}.world-cup-actions{display:flex;gap:12px;flex-wrap:wrap}@media(max-width:920px){.world-cup-panel{grid-template-columns:1fr}.world-cup-poster{justify-self:center}.world-cup-rule-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }

  function addWorldCupSpecial() {
    if (document.querySelector('[data-world-cup-special=true]')) return;
    var liveSection = document.querySelector('.live-snapshot');
    if (!liveSection || !liveSection.parentNode) return;
    addStyles();
    var section = document.createElement('section');
    section.className = 'world-cup-special';
    section.id = 'world-cup';
    section.dataset.worldCupSpecial = 'true';
    section.innerHTML = '<div class="world-cup-panel"><img class="world-cup-poster" src="' + flyerUrl + '" alt="Woodilee World Cup Special flyer"><div class="world-cup-copy"><p class="eyebrow">World Cup Special</p><h2>Pick four teams and follow the table through to the final.</h2><p>Members, friends and family can enter for £5 a ticket. Choose one team from each pot. Entries are first come, first served, and no two tickets can have the same four teams.</p><div class="world-cup-rule-grid"><span>Win = 3 points</span><span>Draw = 2 points</span><span>One point for every goal each team scores</span><span>Tables updated after every round</span></div><div class="world-cup-actions"><a class="button primary" href="' + flyerUrl + '" target="_blank" rel="noopener">Open flyer</a><a class="button secondary" href="' + trackerUrl + '" target="_blank" rel="noopener">Download tracker</a><a class="button secondary" href="mailto:woodileebowlingclub@gmail.com?subject=World%20Cup%20Special%20Teams">Email team picks</a></div></div></div>';
    liveSection.parentNode.insertBefore(section, liveSection.nextSibling);

    var nav = document.querySelector('.nav-links');
    if (nav && !document.querySelector('[data-world-cup-nav=true]')) {
      var link = document.createElement('a');
      link.href = '#world-cup';
      link.textContent = 'World Cup';
      link.dataset.worldCupNav = 'true';
      var visit = Array.prototype.find.call(nav.querySelectorAll('a'), function (item) {
        return item.getAttribute('href') === '#visit';
      });
      if (visit) nav.insertBefore(link, visit);
      else nav.appendChild(link);
    }
  }

  function refresh() {
    addWorldCupSpecial();
    var lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated && window.WOODILEE_CLUB_DATA.lastUpdated) {
      lastUpdated.textContent = 'Last updated: ' + window.WOODILEE_CLUB_DATA.lastUpdated + ' - Monday Night players and scores are shown above.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
  window.addEventListener('load', refresh);
})();
