// Simple in-memory data store.
//
// IMPORTANT: On Vercel, serverless functions do not share memory between
// invocations forever (cold starts reset this array). This is fine for a
// demo/FYP/hackathon build. For real persistence, swap this file's
// internals for a database call (MongoDB Atlas, Vercel KV/Postgres,
// Firebase, etc.) — every function signature below can stay the same.

let reports = [
  {
    id: "seed-1",
    type: "flood",
    description: "Water rising fast near the riverside market. Several families stranded on rooftops.",
    lat: 31.5204,
    lng: 74.3587,
    contact: "0300-0000000",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    comments: [
      { author: "Dispatcher", text: "Rescue boat dispatched, ETA 15 min.", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() }
    ]
  },
  {
    id: "seed-2",
    type: "fire",
    description: "Building fire on 3rd floor, smoke visible from street.",
    lat: 31.5497,
    lng: 74.3436,
    contact: "0311-0000000",
    status: "in-progress",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    comments: []
  }
];

function getAll() {
  return reports.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getById(id) {
  return reports.find(r => r.id === id) || null;
}

function create({ type, description, lat, lng, contact }) {
  const now = new Date().toISOString();
  const report = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: type || "other",
    description: description || "",
    lat,
    lng,
    contact: contact || "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
    comments: []
  };
  reports.unshift(report);
  return report;
}

function updateStatus(id, status) {
  const report = getById(id);
  if (!report) return null;
  const allowed = ["pending", "in-progress", "resolved"];
  if (!allowed.includes(status)) return null;
  report.status = status;
  report.updatedAt = new Date().toISOString();
  return report;
}

function addComment(id, { author, text }) {
  const report = getById(id);
  if (!report) return null;
  const comment = {
    author: author || "Anonymous",
    text: text || "",
    createdAt: new Date().toISOString()
  };
  report.comments.push(comment);
  report.updatedAt = new Date().toISOString();
  return report;
}

module.exports = { getAll, getById, create, updateStatus, addComment };
