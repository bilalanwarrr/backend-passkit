const fs = require("fs");
const fastcsv = require("fast-csv");
const path = require("path");

const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

const writeDataToCsv = (data, filePath) => {
  ensureDirectoryExistence(filePath);

  const ws = fs.createWriteStream(filePath);

  fastcsv.write(data, { headers: true }).pipe(ws);
};

module.exports = writeDataToCsv;
