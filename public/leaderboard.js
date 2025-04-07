let allData = [];

async function fetchLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        allData = data; // Store full data for toggling

        renderLeaderboard(data.slice(0, 5)); // Show top 5 by default
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
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
    renderLeaderboard(allData.slice(0, 5));
    this.classList.add('active');
    document.getElementById('all-btn').classList.remove('active');
});

document.getElementById('all-btn').addEventListener('click', function () {
    renderLeaderboard(allData);
    this.classList.add('active');
    document.getElementById('top5-btn').classList.remove('active');
});

// Refresh leaderboard every 5 sec
setInterval(fetchLeaderboard, 5000);

// Initial fetch
fetchLeaderboard();

