require("dotenv").config();

module.exports = {
  passkitApiKey: process.env.PASSKIT_API_KEY,
  passkitApiSecret: process.env.PASSKIT_API_SECRET,
  passkitApiUrl: process.env.PASSKIT_API_URL,
};
