document.addEventListener('DOMContentLoaded', function () {
  let allData = [];
  let currentPlant = 'tomato';
  let currentView = 'top5';

  const toggleBtn = document.getElementById('navbar-toggle');
  const navLinks = document.getElementById('navbar-links');

  // Mobile navbar toggle and click-outside to close
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      navLinks.classList.toggle('show');
      toggleBtn.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
      const isClickInsideMenu =
        event.target.closest('#navbar-links') || event.target.closest('#navbar-toggle');

      if (!isClickInsideMenu) {
        navLinks.classList.remove('show');
        toggleBtn.classList.remove('open');
      }
    });
  }

  // Fetch leaderboard data
  async function fetchLeaderboard() {
    try {
      const response = await fetch('/leaderboard');
      const data = await response.json();
      allData = data;
      updateLeaderboardView();
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }

  // Update based on view
  function updateLeaderboardView() {
    const filteredData = allData.filter(entry => entry.plantType?.toLowerCase() === currentPlant);
    const displayData = currentView === 'top5' ? filteredData.slice(0, 5) : filteredData;
    renderLeaderboard(displayData);
  }

  function renderLeaderboard(data) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    const leaderboardWrapper = document.getElementById('leaderboard-wrapper');

    leaderboardBody.innerHTML = '';
    leaderboardWrapper.className = `leaderboard-wrapper ${currentPlant}-theme`;

    const entriesContainer = document.createElement('div');
    entriesContainer.className = 'leaderboard-entries';

    data.forEach((entry, index) => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'leaderboard-entry';

      const scoreDisplay = (typeof entry.score === 'number' && !isNaN(entry.score))
        ? `${entry.score.toFixed(2)} pts`
        : 'N/A';

      entryDiv.innerHTML = `
        <div class="rank-number">${index + 1}</div>
        <div class="entry-name">${entry.plantName || 'Unnamed Plant'}</div>
        <div class="entry-score">${scoreDisplay}</div>
      `;

      entriesContainer.appendChild(entryDiv);
    });

    leaderboardBody.appendChild(entriesContainer);

    const lastUpdatedEl = document.getElementById('last-updated');
    let latestTimestamp = null;

    if (data.length > 0) {
      latestTimestamp = data.reduce((latest, entry) => {
        const ts = new Date(entry.lastUpdated);
        return (!isNaN(ts) && (!latest || ts > latest)) ? ts : latest;
      }, null);
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zoneMap = {
      'America/New_York': 'ET',
      'America/Chicago': 'CT',
      'America/Denver': 'MT',
      'America/Los_Angeles': 'PT',
      'America/Phoenix': 'MT',
      'America/Anchorage': 'AKT',
      'Pacific/Honolulu': 'HT',
    };

    const shortLabel = zoneMap[timeZone] || timeZone;
    const options = {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    lastUpdatedEl.textContent = `Last Updated: ${
      latestTimestamp
        ? latestTimestamp.toLocaleString('en-US', options)
        : new Date().toLocaleString('en-US', options)
    } ${shortLabel}`;
  }

  // Handle tab switching
  const plantTabs = document.querySelectorAll('.tab-button');
  plantTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      plantTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentPlant = this.dataset.plant;
      updateLeaderboardView();
    });
  });

  // Handle view toggle
  document.getElementById('top5-btn').addEventListener('click', function () {
    currentView = 'top5';
    this.classList.add('active');
    document.getElementById('all-btn').classList.remove('active');
    updateLeaderboardView();
  });

  document.getElementById('all-btn').addEventListener('click', function () {
    currentView = 'all';
    this.classList.add('active');
    document.getElementById('top5-btn').classList.remove('active');
    updateLeaderboardView();
  });

  // Start fetching leaderboard
  fetchLeaderboard();
  setInterval(fetchLeaderboard, 5000);
});
