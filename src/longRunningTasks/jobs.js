const Queue = require("bull");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const { createToken } = require("../../utils/createToken");
const { padToTwoDigits } = require("../../utils/padToTwoDigits");
const writeDataToCsv = require("../../utils/witeDataToCSV");
const config = require("../../config");

const jobQueue = new Queue("jobQueue", {
  limiter: {
    max: 1000,
    duration: 60000,
  },
  settings: {
    stallInterval: 30000, // Increase the stall interval to 30 seconds
    maxStalledCount: 10, // Increase the max stalled count to allow more retries
    retryProcessDelay: 5000, // Delay between retries set to 5 seconds
    lockDuration: 3600000, // Set the lock duration to 1 hour (adjust based on your longest job)
    backoffStrategies: {
      exponential: function (attemptsMade, err) {
        return Math.min(60 * 1000, Math.pow(2, attemptsMade) * 1000); // Exponential backoff with max 1 minute delay
      },
    },
  },
  defaultJobOptions: {
    attempts: 10, // Number of retry attempts
    backoff: {
      type: "exponential",
      delay: 3000, // Initial delay of 3 seconds, increasing exponentially
    },
    timeout: 43200000, // 12 hours timeout, make sure it covers your longest possible job duration
    // removeOnComplete: true, // Automatically remove completed jobs
    // removeOnFail: true, // Automatically remove failed jobs
    removeOnComplete: 100, // Automatically remove completed jobs after 100 completed jobs
    removeOnFail: 100, // Automatically remove failed jobs after 100 failed jobs
  },
});

const offerURL = config.passkitApiUrl + "coupon/singleUse/offer";
const couponURL = config.passkitApiUrl + "coupon/singleUse/coupon";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Process jobs in the queue
jobQueue.process(async (job, done) => {
  const { campaignId, beforeRedeemPassTemplateId, files, userEmail } = job.data;

  try {
    const results = {};
    const data = [];
    const errors = [];

    const fileProcessingPromises = Object.keys(files).map(async (key) => {
      const file = files[key][0]; // Get the first file for each key ('offers' and 'users')
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

    await Promise.all(fileProcessingPromises);

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

    if (errors.length > 0) {
      throw new Error("Error processing some offers or coupons");
    }

    const outputFilePath = path.join(__dirname, "../../outputs", "output.csv");
    writeDataToCsv(data, outputFilePath);

    // Send the CSV file via email
    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Your CSV file is ready",
      text: "Please find the attached CSV file.",
      attachments: [
        {
          filename: "output.csv",
          path: outputFilePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    done();
  } catch (err) {
    // Send an error email
    const errorMailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Error occurred during CSV file generation",
      text: `An error occurred while generating your CSV file: ${err.message}`,
    };

    await transporter.sendMail(errorMailOptions);
    done(err);
  }
});

module.exports = jobQueue;
