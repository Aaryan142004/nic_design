
document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const closeBtn = document.getElementById("close-btn");
  const stateSearch = document.getElementById("stateSearch");
  const stateList = document.getElementById("stateList");
  const refreshBtn = document.getElementById("refresh");
  const menuBtn = document.getElementById("menu-btn");
  const randomBtn = document.getElementById("randomState");

  const partyColors = {
    "TDP+": "#FF9933", TRS: "#0000FF", BJP: "green", INC: "red", SP: "#FF0000",
    "BJP+": "#3B7A57", TMC: "#ffb703", AIADMK: "#007f5f", CPM: "#ff0055", SDF: "#3a86ff", "INC+": "#9b5de5", "RJD+": "#4cc9f0"
  };

  let map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  let stateLayer = null;
  let allStates = [];
  let dataByState = {};
  let stateLayerMap = {};
  let pieChart = null;
  let chartA = null;
  let chartB = null;
  let currentMapStyle = "seats";

  closeBtn?.addEventListener("click", () => {
    sidebar.classList.add("hidden");
    menuBtn.classList.add("visible");
  });

  menuBtn?.addEventListener("click", () => {
    sidebar.classList.remove("hidden");
    menuBtn.classList.remove("visible");
  });

  refreshBtn?.addEventListener("click", () => {
    clearAllStateColors();
    map.setView([20.5937, 78.9629], 5);
    showToast("🔄 Map reset and data cleared");
  });

  randomBtn?.addEventListener("click", () => {
    const rand = allStates[Math.floor(Math.random() * allStates.length)];
    const norm = normalize(rand);
    const layer = stateLayerMap[norm];
    const sData = dataByState[norm];
    if (layer && sData) {
      clearAllStateColors();
      map.fitBounds(layer.getBounds());
      updateDashboard({ state: rand, ...sData });
      colorState(norm, currentMapStyle);
    }
  });

  fetch("/election-data")
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Election Data Fetched:", data);
      data.forEach((item) => {
        dataByState[normalize(item.state)] = {
          seats: +item.totalSeats,
          party1: item.party1 || "Party1",
          party1Seats: +item.party1Seats || 0,
          party2: item.party2 || "Party2",
          party2Seats: +item.party2Seats || 0,
        };
      });
      return fetch("/data/Indian_States.geojson");
    })
    .then((res) => res.json())
    .then((geojson) => {
      allStates = geojson.features.map((f) => f.properties.NAME_1).sort();
      populateComparisonDropdowns();
      stateLayer = L.geoJSON(geojson, {
        style: () => ({
          fillColor: "#ccc",
          weight: 2,
          opacity: 1,
          color: "white",
          fillOpacity: 0.7,
        }),
        onEachFeature,
      }).addTo(map);
    });

  function normalize(name) {
    return name?.toLowerCase().replace(/[^a-z]/g, "") || "";
  }

  function onEachFeature(feature, layer) {
    const sName = feature.properties.NAME_1;
    const norm = normalize(sName);
    const sData = dataByState[norm];
    stateLayerMap[norm] = layer;
    console.log("🧩 Checking match:", sName, "->", norm, sData);

    const popup = sData
      ? `${sName}: ${sData.seats} seats<br>${sData.party1}: ${sData.party1Seats}<br>${sData.party2}: ${sData.party2Seats}`
      : `${sName}: No data available`;

    layer.bindPopup(popup);

    layer.on("click", () => {
      clearAllStateColors();
      map.fitBounds(layer.getBounds());
      if (sData) {
        updateDashboard({ state: sName, ...sData });
        colorState(norm, currentMapStyle);
      }
    });

    layer.on("mouseover", () => {
      layer.setStyle({ weight: 3, color: "#38bdf8" });
    });

    layer.on("mouseout", () => {
      layer.setStyle({ weight: 2, color: "white" });
    });
  }

  function updateDashboard(data) {
    document.getElementById("pieChartContainer").style.display = "block";
    document.getElementById("stateName").textContent = data.state;
    document.getElementById("party1Name").textContent = data.party1;
    document.getElementById("party1Seats").textContent = data.party1Seats;
    document.getElementById("party2Name").textContent = data.party2;
    document.getElementById("party2Seats").textContent = data.party2Seats;

    if (pieChart) pieChart.destroy();
    const ctx = document.getElementById("seatDistribution").getContext("2d");
    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: [data.party1, data.party2],
        datasets: [{
          data: [data.party1Seats, data.party2Seats],
          backgroundColor: [
            partyColors[data.party1] || "#ccc",
            partyColors[data.party2] || "#aaa",
          ],
        }],
      },
      options: {
        plugins: {
          title: { display: true, text: `${data.state} - ${data.seats} Seats` },
          legend: { position: "bottom" },
        },
      },
    });
  }

  function colorState(norm, type = "seats") {
    const layer = stateLayerMap[norm];
    const sData = dataByState[norm];
    if (!layer || !sData) return;

    const value = type === "party"
      ? (sData.party1Seats > sData.party2Seats ? sData.party1 : sData.party2)
      : sData.seats;

    const color = getColor(value, type);
    layer.setStyle({ fillColor: color });
  }

  function getColor(value, type = "seats") {
    if (type === "party") return partyColors[value] || "#999";
    return value > 40 ? "#16a34a"
      : value > 30 ? "#84cc16"
      : value > 20 ? "#f59e0b"
      : value > 10 ? "#f97316"
      : value > 5 ? "#ef4444"
      : "#94a3b8";
  }

  function clearAllStateColors() {
    if (!stateLayer) return;
    stateLayer.eachLayer((layer) => {
      layer.setStyle({ fillColor: "#ccc" });
    });
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 3000);
  }

  stateSearch?.addEventListener("input", () => {
    const term = stateSearch.value.toLowerCase();
    const results = allStates.filter((s) => s.toLowerCase().includes(term));
    stateList.innerHTML = results.map((s) => `<li>${s}</li>`).join("");
    stateList.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        stateSearch.value = li.textContent;
        stateList.innerHTML = "";
        const norm = normalize(li.textContent);
        const layer = stateLayerMap[norm];
        const sData = dataByState[norm];
        if (layer && sData) {
          clearAllStateColors();
          map.fitBounds(layer.getBounds());
          updateDashboard({ state: li.textContent, ...sData });
          colorState(norm, currentMapStyle);
        }
      });
    });
  });

  document.getElementById("compareBtn")?.addEventListener("click", () => {
    const a = normalize(document.getElementById("stateA").value);
    const b = normalize(document.getElementById("stateB").value);
    if (!a || !b || a === b) return showToast("⚠️ Select two different states!");
    drawCompareChart(a, "chartA", "labelA", chartA, (c) => chartA = c);
    drawCompareChart(b, "chartB", "labelB", chartB, (c) => chartB = c);
  });

  function drawCompareChart(norm, canvasId, labelId, chartObj, setChartRef) {
    const data = dataByState[norm];
    if (!data) return;
    document.getElementById(labelId).textContent = allStates.find(s => normalize(s) === norm) || norm;

    if (chartObj) chartObj.destroy();
    const ctx = document.getElementById(canvasId).getContext("2d");
    const newChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: [data.party1, data.party2],
        datasets: [{
          data: [data.party1Seats, data.party2Seats],
          backgroundColor: [
            partyColors[data.party1] || "#ccc",
            partyColors[data.party2] || "#aaa",
          ],
        }],
      },
      options: {
        plugins: {
          title: { display: true, text: `${data.seats} Total Seats` },
          legend: { position: "bottom" },
        },
      },
    });
    setChartRef(newChart);
  }

  function populateComparisonDropdowns() {
    const stateA = document.getElementById("stateA");
    const stateB = document.getElementById("stateB");
    if (!stateA || !stateB) return;
    allStates.forEach((s) => {
      stateA.appendChild(new Option(s, s));
      stateB.appendChild(new Option(s, s));
    });
  }
});
