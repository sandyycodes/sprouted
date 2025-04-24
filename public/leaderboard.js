let allData = [];
let currentPlant = 'tomato';
let currentView = 'top5'; // 'top5' or 'all'

// Fetch leaderboard data from the server
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

// Filter and render leaderboard based on plant and view
function updateLeaderboardView() {
  const filteredData = allData.filter(entry => entry.plantType?.toLowerCase() === currentPlant);
  const displayData = currentView === 'top5' ? filteredData.slice(0, 5) : filteredData;
  renderLeaderboard(displayData);
}

// Render leaderboard entries
// function renderLeaderboard(data) {
//   const leaderboardBody = document.getElementById('leaderboard-body');
//   leaderboardBody.innerHTML = ''; // Clear previous

//   const entriesContainer = document.createElement('div');
//   entriesContainer.className = 'leaderboard-entries';

//   data.forEach((entry, index) => {
//     const entryDiv = document.createElement('div');
//     entryDiv.className = 'leaderboard-entry';

//     entryDiv.innerHTML = `
//       <div class="rank-number">${index + 1}</div>
//       <div class="entry-name">${entry.plantName}</div>
//       <div class="entry-score">${entry.score.toFixed(2)} pts</div>
//     `;

//     entriesContainer.appendChild(entryDiv);
//   });

//   leaderboardBody.appendChild(entriesContainer);
// }
function renderLeaderboard(data) {
  const leaderboardBody = document.getElementById('leaderboard-body');
  const leaderboardWrapper = document.getElementById('leaderboard-wrapper');

  // Clear and update wrapper class
  leaderboardBody.innerHTML = '';
  leaderboardWrapper.className = `leaderboard-wrapper ${currentPlant}-theme`;

  const entriesContainer = document.createElement('div');
  entriesContainer.className = 'leaderboard-entries';

  data.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'leaderboard-entry';

    entryDiv.innerHTML = `
      <div class="rank-number">${index + 1}</div>
      <div class="entry-name">${entry.plantName}</div>
      <div class="entry-score">${entry.score.toFixed(2)} pts</div>
    `;

    entriesContainer.appendChild(entryDiv);
  });

  leaderboardBody.appendChild(entriesContainer);

  // Update last updated time
  const lastUpdatedEl = document.getElementById('last-updated');
  if (data[0]?.lastUpdated) {
    const updatedDate = new Date(data[0].lastUpdated);
    lastUpdatedEl.textContent = `Last Updated: ${updatedDate.toLocaleString()}`;
  } else {
    lastUpdatedEl.textContent = `Last Updated: --`;
  }
}


// Handle plant tab switching
const plantTabs = document.querySelectorAll('.tab-button');

plantTabs.forEach(tab => {
  tab.addEventListener('click', function () {
    plantTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    currentPlant = this.dataset.plant;
    updateLeaderboardView();
  });
});

// Handle view toggling (top 5 / all)
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


// Fetch leaderboard on load and set interval
fetchLeaderboard();
setInterval(fetchLeaderboard, 5000);
