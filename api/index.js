// Vercel wraps this exported Express app as a serverless function.
// All /api/* requests get routed here (see vercel.json rewrites).
module.exports = require("../lib/app");
