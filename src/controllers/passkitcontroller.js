const axios = require("axios");
const config = require("../../config");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const passkitApiKey = config.passkitApiKey;
const passkitApiSecret = config.passkitApiSecret;

async function createSingleUseCouponCampaign(req, res) {
  const passkitApiUrl = "https://api.pub2.passkit.io/coupon/singleUse/campaign";
  try {
    const { campaignName, status, passTypeIdentifier, ianaTimezone } = req.body;

    if (!campaignName || !status) {
      return res
        .status(400)
        .json({ error: "campaignName and status are required fields" });
    }

    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload = {
      uid: passkitApiKey,
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
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

    const requestBody = {
      name: campaignName,
      status,
      ianaTimezone: ianaTimezone,
      localizedName: {
        translations: {},
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    if (status.includes("PROJECT_PUBLISHED")) {
      requestBody.passTypeIdentifier = passTypeIdentifier;
    }

    const response = await axios.post(passkitApiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    res.status(201).json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create single-use coupon campaign" });
  }
}

async function createSingleUseCouponOffer(req, res) {
  const passkitApiUrl = "https://api.pub2.passkit.io/coupon/singleUse/offer";
  try {
    const {
      offerTitle,
      offerDetails,
      beforeRedeemPassTemplateId,
      campaignId,
      offerShortTitle,
      issueStartDate,
      couponExpirySettings,
      info,
    } = req.body;
    if (!offerTitle || !offerDetails || !beforeRedeemPassTemplateId) {
      return res.status(400).json({
        error:
          "offerTitle, offerDetails, and beforeRedeemPassTemplateId are required fields",
      });
    }

    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload = {
      uid: passkitApiKey,
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
    };

    const base64UrlEncode = (obj) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signature = crypto
      .createHmac("sha256", passkitApiSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    const requestBody = {
      offerTitle: offerTitle.slice(0, 60),
      offerShortTitle: offerShortTitle.slice(0, 20),
      offerDetails: offerDetails.slice(0, 255),
      beforeRedeemPassTemplateId,
      issueStartDate,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      campaignId,
      couponExpirySettings,
      info,
    };

    // const temp = requestBody.offerTitle;
    // requestBody.offerTitle = requestBody.offerShortTitle;
    // requestBody.offerShortTitle = temp;

    const response = await axios.post(passkitApiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error("Error creating single-use coupon offer:", error);
    res.status(500).json({ error: "Failed to create single-use coupon offer" });
  }
}

async function createSingleUseCoupon(req, res) {
  const passkitApiUrl = "https://api.pub2.passkit.io/coupon/singleUse/coupon";
  try {
    const { offerId, campaignId, person, expiryDate, sku } = req.body;

    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload = {
      uid: passkitApiKey,
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 1 hour
    };

    const base64UrlEncode = (obj) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signature = crypto
      .createHmac("sha256", passkitApiSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    const requestBody = {
      sku,
      offerId,
      campaignId,
      person,
      expiryDate,
    };

    const response = await axios.post(passkitApiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error(
      "Error creating single-use coupon:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to create single-use coupon" });
  }
}

module.exports = {
  createSingleUseCoupon,
};

module.exports = {
  createSingleUseCouponCampaign,
  createSingleUseCouponOffer,
  createSingleUseCoupon,
};
