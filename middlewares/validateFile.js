const { HttpError } = require('../helpers');

const validateFile = (req, res, next) => {

  if (!req.file) {
    return next(HttpError(400, 'No file provided'));
  }

  next();
};

module.exports = validateFile;