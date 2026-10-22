
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Eye Tracker backend is running"
  });
});

app.get("/api/tracker/status", (req, res) => {
  res.json({
    status: "not_connected",
    message: "Python tracker integration is not configured yet"
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
