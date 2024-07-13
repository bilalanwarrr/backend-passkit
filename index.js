const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const passkitRoutes = require("./src/routes/passkitroute");
const passRoutes = require("./src/routes/passRoutes");
const downloadRoutes = require("./src/routes/downloadRoutes");
const templateRoutes = require("./src/routes/templateRoutes");
const imagesRoutes = require("./src/routes/imagesRoutes");
const campaignRoutes = require("./src/routes/campaignRoutes");
const authRoutes = require("./src/routes/authRoutes");
const verifyToken = require("./utils/verifyToken");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: "50mb" })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://smartchecks.app",
    "http://localhost:5173",
    "http://localhost:4173",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, POST, PATCH, DELETE, GET, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  next();
});

app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutes
  next();
});

// Routes
app.use("/api/passkit", passkitRoutes);
app.use("/api/pass", passRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/template", templateRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/auth", authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
