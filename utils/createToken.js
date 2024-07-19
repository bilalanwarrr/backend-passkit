const config = require("../config");
const passkitApiKey = config.passkitApiKey;
const passkitApiSecret = config.passkitApiSecret;

const createToken = () => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    uid: passkitApiKey,
    iat: Math.floor(new Date() / 1000) - 30,
    exp: Math.floor(new Date() / 1000) + 5 * 60 * 60,
  };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  const signature = require("crypto")
    .createHmac("sha256", passkitApiSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  return token;
};

module.exports = {
  createToken,
};
