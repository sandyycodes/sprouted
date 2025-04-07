let allData = [];
let currentView = 'top5'; // 'top5' or 'all'

async function fetchLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        allData = data;

        updateLeaderboardView(); // Keep view consistent with user selection
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
}

function updateLeaderboardView() {
    if (currentView === 'top5') {
        renderLeaderboard(allData.slice(0, 5));
    } else {
        renderLeaderboard(allData);
    }
}

function renderLeaderboard(data) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = ''; // Clear existing rows

    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.plantName}</td>
            <td>${entry.device_id}</td>
            <td>${entry.score.toFixed(2)}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Button click handlers
document.getElementById('top5-btn').addEventListener('click', function () {
    currentView = 'top5';
    updateLeaderboardView();
    this.classList.add('active');
    document.getElementById('all-btn').classList.remove('active');
});

document.getElementById('all-btn').addEventListener('click', function () {
    currentView = 'all';
    updateLeaderboardView();
    this.classList.add('active');
    document.getElementById('top5-btn').classList.remove('active');
});

// Initial fetch + periodic refresh
fetchLeaderboard();
setInterval(fetchLeaderboard, 5000);
