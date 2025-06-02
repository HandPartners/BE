const getByteLength = (str) => {
  return Buffer.byteLength(str, 'utf8');
};

module.exports = {
  getByteLength,
};
