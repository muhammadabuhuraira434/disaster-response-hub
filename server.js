const app = require("./lib/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Disaster Response Hub running at http://localhost:${PORT}`);
});
