const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

async function donwloadOutputFile(req, res) {
  const filePath = path.join(__dirname, "../../outputs/output.csv");

  res.download(filePath, (err) => {
    if (err) {
      throw new Error("Error downloading the file");
      res.status(500).send("Error downloading the file");
    }
    fs.unlink(filePath, (err) => {
      if (err) {
        throw new Error("Error deleting the file");
      }
    });
  });
}

module.exports = {
  donwloadOutputFile,
};
