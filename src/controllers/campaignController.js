const config = require("../../config");
const { createToken } = require("../../utils/createToken");
const axios = require("axios");

const listUrl = config.passkitApiUrl + "coupon/singleUse/campaigns/list";
const createUrl = config.passkitApiUrl + "coupon/singleUse/campaign";
const deleteUrl = config.passkitApiUrl + "coupon/singleUse/campaign";
const JSONStream = require("JSONStream");
const through2 = require("through2");

async function getListOfCampaigns(req, res) {
  try {
    const token = createToken();
    const requestData = {
      limit: -1,
      orderBy: "created",
      order: "desc",
    };

    const response = await axios({
      method: "post",
      url: listUrl,
      data: requestData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      responseType: "stream",
    });


    let campaigns = {};

    // Transform stream to extract id and name
    response.data
      .pipe(JSONStream.parse("*"))
      .pipe(
        through2.obj((campaign, enc, callback) => {
          // Assuming the structure of each campaign matches the sample JSON
          campaigns[campaign.id] = campaign.name;

          callback(null); // Continue processing
        })
      )
      .on("finish", () => {
        res.status(200).json(campaigns);
      })
      .on("error", (err) => {
        res.status(500).send(err.message);
      });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
}

async function createCampaign(req, res) {
  try {
    const { name, passTypeIdentifier, ianaTimezone } = req.body;

    if (!name || !ianaTimezone) {
      return res
        .status(400)
        .json({ error: "campaign Name and status are required fields" });
    }

    const token = createToken();
    const status = ["PROJECT_ACTIVE_FOR_OBJECT_CREATION", "PROJECT_PUBLISHED"];

    const requestBody = {
      name,
      status,
      ianaTimezone,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    if (status.includes("PROJECT_PUBLISHED")) {
      requestBody.passTypeIdentifier = passTypeIdentifier;
    }

    const response = await axios.post(createUrl, requestBody, {
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

async function deleteCampaigns(req, res) {
  try {
    const requestData = req.body.ids;

    for (let id of Object.keys(requestData)) {
      const token = createToken();
      const response = await axios({
        method: "delete",
        url: deleteUrl + "/" + id,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    }

    res.status(200).json({ message: "Deleted single-use coupon campaigns" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete single-use coupon campaigns" });
  }
}

module.exports = {
  getListOfCampaigns,
  createCampaign,
  deleteCampaigns,
};
