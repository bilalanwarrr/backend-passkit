const config = require("../../config");
const { createToken } = require("../../utils/createToken");
const path = require("path");
const axios = require("axios");
const fs = require("fs").promises;

const passkitApiUrl = config.passkitApiUrl + "images";

const convertImageToBase64 = async (imagePath) => {
  try {
    const data = await fs.readFile(imagePath);
    const base64Image = Buffer.from(data, "binary").toString("base64");
    await fs.unlink(imagePath); // Delete the file after conversion
    return base64Image;
  } catch (err) {
    throw new Error(`Failed to convert and delete image: ${err.message}`);
  }
};

async function generateImagesObjects(req, res) {
  try {
    const token = createToken();

    const iconBase64 = await convertImageToBase64(
      path.join(__dirname, `../../${req.files.icon[0].path}`)
    );
    const logoBase64 = await convertImageToBase64(
      path.join(__dirname, `../../${req.files.logo[0].path}`)
    );
    const appleLogoBase64 = await convertImageToBase64(
      path.join(__dirname, `../../${req.files.appleLogo[0].path}`)
    );
    const heroBase64 = await convertImageToBase64(
      path.join(__dirname, `../../${req.files.hero[0].path}`)
    );
    const stripBase64 = await convertImageToBase64(
      path.join(__dirname, `../../${req.files.strip[0].path}`)
    );

    const requestData = {
      name: req.body.name,
      imageData: {
        icon: iconBase64,
        logo: logoBase64,
        appleLogo: appleLogoBase64,
        hero: heroBase64,
        strip: stripBase64,
      },
    };

    const response = await axios.post(passkitApiUrl, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  generateImagesObjects,
};
