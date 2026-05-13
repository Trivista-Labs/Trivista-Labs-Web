require("dotenv").config();
const express = require("express");
const cors = require("cors");
const contactRoutes = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://trivistalabs.lk",
    "https://www.trivistalabs.lk",
    "https://trivistalabs.io",
    "https://www.trivistalabs.io",
    "https://trivista-labs-web.vercel.app",
  ],
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/contact", contactRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Trivista Labs backend running on http://localhost:${PORT}`);
});
