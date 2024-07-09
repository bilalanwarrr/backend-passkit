const config = require("../../config");
const { createToken } = require("../../utils/createToken");
const axios = require("axios");
const generateTemplateBody = require("../../utils/generateTemplateBody");
const JSONStream = require("JSONStream");
const through2 = require("through2");

const generateTemplateUrl = config.passkitApiUrl + "template";
const getTemplatesUrl = config.passkitApiUrl + "templates/user/list";
const deleteTemplateUrl = config.passkitApiUrl + "template";

async function generateTemplate(req, res) {
  try {
    const token = createToken();
    const requestData = generateTemplateBody(req.body);

    const response = await axios.post(generateTemplateUrl, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      res.status(500).json({ error: "No response received from server" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function getListOfTemplates(req, res) {
  try {
    const token = createToken();
    const requestData = {
      limit: -1,
      orderBy: "created",
      orderAsc: false,
    };

    const response = await axios({
      method: "post",
      url: getTemplatesUrl,
      data: requestData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      responseType: "stream", 
    });

    let templates = {};

    
    response.data
      .pipe(JSONStream.parse("result.*"))
      .pipe(
        through2.obj((template, enc, callback) => {
          if (template.protocol === "SINGLE_USE_COUPON") {
            templates[template.id] = template.name;
          }
          callback(null); // Continue processing
        })
      )
      .on("finish", () => {
        res.status(200).json(templates);
      })
      .on("error", (err) => {
        res.status(500).send(err.message || "Internal server error");
      });
  } catch (error) {
    res.status(500).send(error.message || "Internal server error");
  }
}

async function deleteTemplate(req, res) {
  try {
    const token = createToken();
    const requestData = req.body.ids;

    for (let id of Object.keys(requestData)) {
      const response = await axios({
        method: "delete",
        url: deleteTemplateUrl + "/" + id,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    }

    res.status(200).send("Templates deleted successfully");
  } catch (error) {
    res.send(error.message || "Internal server error");
  }
}

module.exports = {
  generateTemplate,
  getListOfTemplates,
  deleteTemplate,
};
