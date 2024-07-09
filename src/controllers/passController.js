const config = require("../../config");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const axios = require("axios");
const writeDataToCsv = require("../../utils/witeDataToCSV");
const { padToTwoDigits } = require("../../utils/padToTwoDigits");
const { createToken } = require("../../utils/createToken");

const offerURL = config.passkitApiUrl + "coupon/singleUse/offer";
const couponURL = config.passkitApiUrl + "coupon/singleUse/coupon";

async function passCreation(req, res) {
  const campaignId = req.body.campaignId;
  const beforeRedeemPassTemplateId = req.body.templateId;

  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  const results = {};
  const data = [];
  const errors = [];

  const fileProcessingPromises = Object.keys(req.files).map(async (key) => {
    const file = req.files[key][0]; // Get the first file for each key ('offers' and 'users')
    const filePath = file.path;

    // Process the CSV file
    const fileResults = await new Promise((resolve, reject) => {
      const fileResults = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => fileResults.push(data))
        .on("end", () => {
          fs.unlinkSync(filePath); // Delete the uploaded file after processing
          resolve(fileResults);
        })
        .on("error", (err) => {
          fs.unlinkSync(filePath); // Delete the uploaded file on error
          reject(err);
        });
    });

    results[key] = fileResults; // Store file results in the results object
  });

  try {
    await Promise.all(fileProcessingPromises);
  } catch (err) {
    return res.status(500).json({ error: "Failed to read CSV files" });
  }

  try {
    for (const userData of results.users) {
      let coupons = {};
      let passes = {};
      let skuIndex = 1;
      const {
        LeadFirstName,
        LeadLastName,
        LeadAddress1,
        LeadAddress2,
        LeadCity,
        LeadState,
        LeadZip,
        LeadPinCode,
      } = userData;
      for (const offerData of results.offers) {
        const {
          disclaimers,
          expirationDate,
          offerSublabel,
          primaryOfferLabel,
          passSourceTemplateID,
        } = offerData;

        const issueStartDate = new Date().toISOString();
        const couponExpirySettings = {
          couponExpiryType: "EXPIRE_ON_VARIABLE_DATE_TIME",
        };

        const offerToken = createToken();

        const offerRequestBody = {
          offerTitle: offerSublabel.trim().slice(0, 60),
          offerShortTitle: primaryOfferLabel.trim().slice(0, 20),
          offerDetails: disclaimers.trim().slice(0, 255),
          beforeRedeemPassTemplateId,
          issueStartDate,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          campaignId,
          couponExpirySettings,
        };


        try {
          const offerResponse = await axios.post(offerURL, offerRequestBody, {
            headers: {
              Authorization: `Bearer ${offerToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          const couponToken = createToken();
          const person = {
            forename: LeadFirstName,
            surname: LeadLastName,
          };
          const metaData = {
            address1: LeadAddress1,
            address2: LeadAddress2,
            city: LeadCity,
            state: LeadState,
            zip: LeadZip,
            pinCode: LeadPinCode,
          };

          const sku = userData[`Coupon ${padToTwoDigits(skuIndex)}`];

          const expiryDate = new Date(expirationDate).toISOString();
          const couponRequestBody = {
            sku,
            offerId: offerResponse.data.id,
            campaignId,
            person,
            expiryDate,
            metaData,
          };

          const couponResponse = await axios.post(
            couponURL,
            couponRequestBody,
            {
              headers: {
                Authorization: `Bearer ${couponToken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          coupons[`Coupon ${padToTwoDigits(skuIndex)}`] =
            couponResponse.data.id;
          passes[
            `Pass ${padToTwoDigits(skuIndex)}`
          ] = `https://pub2.pskt.io/${couponResponse.data.id}`;
          skuIndex = skuIndex + 1;
        } catch (err) {
          errors.push(err);
        }
      }

      data.push({
        LeadFirstName,
        LeadLastName,
        LeadAddress1,
        LeadAddress2,
        LeadCity,
        LeadState,
        LeadZip,
        LeadPinCode,
        ...coupons,
        ...passes,
      });
      coupons = {};
      passes = {};
    }
  } catch (err) {
    errors.push(err);
  }

  if (errors.length > 0) {
    return res.status(500).json({ errors, data });
  }

  writeDataToCsv(data, path.join(__dirname, "../../", "outputs", "output.csv"));
  res.json(data);
}

module.exports = {
  passCreation,
};
