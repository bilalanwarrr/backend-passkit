function padToTwoDigits(number) {
  return number.toString().padStart(2, "0");
}

module.exports = {
  padToTwoDigits,
};
