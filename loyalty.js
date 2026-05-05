async function loadLoyalty() {
  try {
    const res = await fetch("/api/loyalty");

    if (!res.ok) {
      console.error("Failed to load loyalty");
      return;
    }

    const data = await res.json();

    const totalPoints = data.totalPoints || 0;
    const activity = data.activity || [];

    //  POINTS 
    document.getElementById("totalPoints").innerText = totalPoints;

    const earnedPoints = activity
      .filter(a => a.points > 0)
      .reduce((sum, a) => sum + a.points, 0);

    document.getElementById("earnedPoints").innerText = earnedPoints;

    // TIERS 
    let tier = "Bronze";
    let next = "";
    if (totalPoints >= 3000) {
      tier = "Platinum";
      next = "Max tier reached";
      document.body.style.backgroundColor = "#E5E4E2";
    } else if (totalPoints >= 2000) {
      tier = "Gold";
      next = `${3000 - totalPoints} to Platinum`;
      document.body.style.backgroundColor = "#FFD700";
    } else if (totalPoints >= 1000) {
      tier = "Silver";
      next = `${2000 - totalPoints} to Gold`;
      document.body.style.backgroundColor = "#acacac";
    } else {
      tier = "Bronze";
      next = `${1000 - totalPoints} to Silver`;
    }
    
    document.getElementById("tier").innerText = tier;
    document.getElementById("nextTier").innerText = next;

    //  ACTIVITY 
    const table = document.getElementById("activityTable");
    table.innerHTML = "";

    activity.forEach(item => {
      table.innerHTML += `
        <tr>
          <td>${item.action}</td>
          <td class="${item.points < 0 ? 'text-danger' : 'text-success'}">
            ${item.points > 0 ? '+' : ''}${item.points}
          </td>
          <td>${item.date}</td>
        </tr>
      `;
    });

    //  REWARDS 
    const rewards = [
      { title: "£10 Off", points: 500 },
      { title: "£25 Off", points: 1000 },
      { title: "Free Delivery", points: 300 },
      { title: "£50 Off", points: 2000 }
    ];

    const container = document.getElementById("rewardsContainer");
    container.innerHTML = "";

    rewards.forEach(r => {
      const disabled = r.points > totalPoints;

      container.innerHTML += `
        <div class="col-md-4">
          <div class="card p-3">
            <h5>${r.title}</h5>
            <p>${r.points} points</p>

            <button class="btn ${disabled ? 'btn-secondary' : 'btn-dark'}"
              ${disabled ? "disabled" : ""}
              onclick="redeemReward(${r.points}, '${r.title}')">
              Redeem
            </button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}

//  REDEEM FUNCTION 
async function redeemReward(points, reward) {
  const confirmRedeem = confirm(`Redeem ${points} points for ${reward}?`);
  if (!confirmRedeem) return;

  const res = await fetch("/api/redeem", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ points, reward })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Reward redeemed!");
    loadLoyalty();
    loadNavPoints();
  } else {
    alert(data.error || "Failed");
  }
}

// INIT
document.addEventListener("DOMContentLoaded", loadLoyalty);