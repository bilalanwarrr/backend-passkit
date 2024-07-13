const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Extract token from Bearer token format
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token not provided in the correct format" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Failed to authenticate token" });
    }

    // If token is valid, save decoded info to request for use in other routes
    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;
