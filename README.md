# AI Disaster Response Hub

"From Distress Signal to Rescue in 60 Seconds"

Real-time, map-based emergency reporting platform. One click sends a victim's
live location; rescuers see it instantly on a map, update its status, and
post progress comments until it's resolved.

## Stack
Node.js, Express, Leaflet.js (OpenStreetMap tiles), Vanilla JS, deployed on Vercel.

## Project structure
```
disaster-response-hub/
├── api/index.js       # Vercel serverless function (wraps the Express app)
├── lib/app.js         # Express app + all API routes
├── lib/store.js       # In-memory data store (swap for a DB later if needed)
├── public/             # Frontend: index.html, css/, js/
├── server.js           # Local dev entry point
├── vercel.json          # Routes /api/* to the serverless function
└── package.json
```

## Run it locally
```
npm install
npm start
```
Then open http://localhost:3000

## Note on data persistence
Reports are stored in memory. Locally that's fine — data survives as long as
the server keeps running. On Vercel, serverless functions can "cold start"
and lose in-memory data between periods of inactivity. For a demo/FYP this
is usually fine. If you need reports to persist permanently, swap the
contents of `lib/store.js` for calls to a real database (MongoDB Atlas free
tier, Vercel Postgres, or Firebase are the easiest options) — every other
file stays the same.

## Deploying to Vercel — see full walkthrough in the chat response.
