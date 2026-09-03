const express = require("express");
const cors = require("cors");
const path = require("path");
const store = require("./store");

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend (only matters when running locally with `node server.js`;
// on Vercel the /public folder is served automatically as static files)
app.use(express.static(path.join(__dirname, "..", "public")));

// --- API routes ---

// Get all reports
app.get("/api/reports", (req, res) => {
  res.json(store.getAll());
});

// Get a single report
app.get("/api/reports/:id", (req, res) => {
  const report = store.getById(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report);
});

// Create a new report (the "SOS" button hits this)
app.post("/api/reports", (req, res) => {
  const { type, description, lat, lng, contact } = req.body || {};

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng (numbers) are required" });
  }

  const report = store.create({ type, description, lat, lng, contact });
  res.status(201).json(report);
});

// Update a report's status (rescuer marks pending -> in-progress -> resolved)
app.patch("/api/reports/:id", (req, res) => {
  const { status } = req.body || {};
  const updated = store.updateStatus(req.params.id, status);
  if (!updated) return res.status(400).json({ error: "Invalid report id or status" });
  res.json(updated);
});

// Add a comment / update to a report's thread
app.post("/api/reports/:id/comments", (req, res) => {
  const { author, text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "Comment text is required" });
  const updated = store.addComment(req.params.id, { author, text });
  if (!updated) return res.status(404).json({ error: "Report not found" });
  res.status(201).json(updated);
});

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

module.exports = app;
