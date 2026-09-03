const STATUS_COLORS = {
  pending: "#e63946",
  "in-progress": "#f4a261",
  resolved: "#2a9d8f"
};

let map;
let markers = {}; // id -> leaflet marker
let reports = [];
let activeFilter = "all";
let pendingLocation = null;
let currentDetailId = null;

// ---------- Map ----------

function initMap() {
  map = L.map("map").setView([31.5204, 74.3587], 12); // default: Lahore, PK
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);
}

function markerIcon(status) {
  const color = STATUS_COLORS[status] || "#999";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function renderMarkers() {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  const visible = reports.filter(r => activeFilter === "all" || r.status === activeFilter);

  visible.forEach(r => {
    const marker = L.marker([r.lat, r.lng], { icon: markerIcon(r.status) }).addTo(map);
    marker.bindPopup(`<b>${escapeHtml(r.type)}</b><br>${escapeHtml(r.description || "")}`);
    marker.on("click", () => openDetail(r.id));
    markers[r.id] = marker;
  });
}

// ---------- Data ----------

async function fetchReports() {
  const res = await fetch("/api/reports");
  reports = await res.json();
  renderMarkers();
  renderList();
}

function renderList() {
  const list = document.getElementById("reportList");
  const visible = reports.filter(r => activeFilter === "all" || r.status === activeFilter);

  document.getElementById("reportCount").textContent = visible.length;

  if (visible.length === 0) {
    list.innerHTML = `<p style="padding:16px;color:#888;font-size:13px;">No reports here.</p>`;
    return;
  }

  list.innerHTML = visible.map(r => `
    <div class="report-card" data-id="${r.id}">
      <div class="report-card-top">
        <span class="report-type">${escapeHtml(r.type)}</span>
        <span class="status-pill status-${r.status}">${r.status.replace("-", " ")}</span>
      </div>
      <div class="report-desc">${escapeHtml(r.description || "No description")}</div>
      <div class="report-time">${timeAgo(r.createdAt)}</div>
    </div>
  `).join("");

  list.querySelectorAll(".report-card").forEach(card => {
    card.addEventListener("click", () => openDetail(card.dataset.id));
  });
}

// ---------- SOS flow ----------

function openSosModal() {
  document.getElementById("sosModal").classList.remove("hidden");
  document.getElementById("disasterDesc").value = "";
  document.getElementById("disasterContact").value = "";
  pendingLocation = null;

  const statusEl = document.getElementById("locationStatus");
  const confirmBtn = document.getElementById("confirmSos");
  confirmBtn.disabled = true;
  statusEl.textContent = "📍 Getting your location...";
  statusEl.className = "location-status";

  if (!navigator.geolocation) {
    statusEl.textContent = "⚠️ Geolocation not supported on this device/browser.";
    statusEl.className = "location-status error";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      pendingLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      statusEl.textContent = `✅ Location captured (accuracy ~${Math.round(pos.coords.accuracy)}m)`;
      statusEl.className = "location-status ok";
      confirmBtn.disabled = false;
    },
    err => {
      statusEl.textContent = "⚠️ Couldn't get your location. Please allow location access and try again.";
      statusEl.className = "location-status error";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function closeSosModal() {
  document.getElementById("sosModal").classList.add("hidden");
}

async function submitSos() {
  if (!pendingLocation) return;

  const payload = {
    type: document.getElementById("disasterType").value,
    description: document.getElementById("disasterDesc").value.trim(),
    contact: document.getElementById("disasterContact").value.trim(),
    lat: pendingLocation.lat,
    lng: pendingLocation.lng
  };

  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeSosModal();
    showToast("🚨 SOS sent! Rescuers can now see your location.");
    await fetchReports();
    const created = await res.json();
    map.setView([created.lat, created.lng], 15);
  } else {
    showToast("Something went wrong sending your SOS. Please try again.");
  }
}

// ---------- Detail modal ----------

function openDetail(id) {
  const r = reports.find(x => x.id === id);
  if (!r) return;
  currentDetailId = id;

  document.getElementById("detailType").textContent = r.type;
  document.getElementById("detailStatus").textContent = r.status.replace("-", " ");
  document.getElementById("detailDesc").textContent = r.description || "No description provided.";
  document.getElementById("detailMeta").textContent =
    `Reported ${timeAgo(r.createdAt)}${r.contact ? " · Contact: " + r.contact : ""}`;
  document.getElementById("statusSelect").value = r.status;

  renderComments(r.comments || []);
  document.getElementById("detailModal").classList.remove("hidden");
}

function renderComments(comments) {
  const thread = document.getElementById("commentThread");
  if (comments.length === 0) {
    thread.innerHTML = `<p style="color:#999;font-size:12px;">No updates yet.</p>`;
    return;
  }
  thread.innerHTML = comments.map(c => `
    <div class="comment">
      <b>${escapeHtml(c.author)}</b>: ${escapeHtml(c.text)}
      <span class="comment-time">${timeAgo(c.createdAt)}</span>
    </div>
  `).join("");
  thread.scrollTop = thread.scrollHeight;
}

function closeDetail() {
  document.getElementById("detailModal").classList.add("hidden");
  currentDetailId = null;
}

async function updateStatus() {
  if (!currentDetailId) return;
  const status = document.getElementById("statusSelect").value;
  const res = await fetch(`/api/reports/${currentDetailId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (res.ok) {
    showToast("Status updated.");
    await fetchReports();
    openDetail(currentDetailId);
  }
}

async function postComment() {
  const input = document.getElementById("commentText");
  const text = input.value.trim();
  if (!text || !currentDetailId) return;

  const res = await fetch(`/api/reports/${currentDetailId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "Rescuer", text })
  });

  if (res.ok) {
    input.value = "";
    await fetchReports();
    openDetail(currentDetailId);
  }
}

// ---------- Utils ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3500);
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  fetchReports();
  setInterval(fetchReports, 15000); // poll for updates every 15s

  document.getElementById("sosBtn").addEventListener("click", openSosModal);
  document.getElementById("cancelSos").addEventListener("click", closeSosModal);
  document.getElementById("confirmSos").addEventListener("click", submitSos);

  document.getElementById("closeDetail").addEventListener("click", closeDetail);
  document.getElementById("statusSelect").addEventListener("change", updateStatus);
  document.getElementById("postComment").addEventListener("click", postComment);
  document.getElementById("commentText").addEventListener("keydown", e => {
    if (e.key === "Enter") postComment();
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderMarkers();
      renderList();
    });
  });
});
