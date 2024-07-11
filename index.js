const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const passkitRoutes = require("./src/routes/passkitroute");
const passRoutes = require("./src/routes/passRoutes");
const downloadRoutes = require("./src/routes/downloadRoutes");
const templateRoutes = require("./src/routes/templateRoutes");
const imagesRoutes = require("./src/routes/imagesRoutes");
const campaignRoutes = require("./src/routes/campaignRoutes");
const authRoutes = require("./src/routes/authRoutes");
const verifyToken = require("./utils/verifyToken");

const corsOptions = {
  origin: ["https://smartchecks.app", "http://localhost:5173", "http://localhost:4173"],
  optionsSuccessStatus: 200, // For legacy browsers
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"]
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

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
