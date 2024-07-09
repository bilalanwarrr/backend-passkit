const jwt = require("jsonwebtoken");

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (email === "admin@gmail.com" && password === "smith123") {
      // Generate JWT token
      const token = jwt.sign({ email }, process.env.SECRET_KEY, {
        expiresIn: "3h",
      });
      res.json({ message: "Login successful", token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const verifyUser = (req, res) => {
  res.json({ message: "User verified", user: req.user });
};

module.exports = {
  loginUser,
  verifyUser,
};
