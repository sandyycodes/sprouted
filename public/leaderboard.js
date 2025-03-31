async function fetchLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();

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
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
}

// Refresh leaderboard every 5 seconds
setInterval(fetchLeaderboard, 5000);

// Fetch leaderboard on page load
fetchLeaderboard();
