const express = require('express');
const path = require('path');
const createHttpError = require('http-errors');
const { isVerifiedUser } = require('../middlewares/tokenVerification');
const upload = require('../middlewares/uploadMiddleware');

const uploadRoute = express.Router();

// Upload logo endpoint
uploadRoute.post('/logo', isVerifiedUser, upload.single('logo'), (req, res, next) => {
  try {
    if (!req.file) {
      const error = createHttpError(400, 'No file uploaded');
      return next(error);
    }

    const logoPath = `uploads/${req.file.filename}`;

    res.status(200).json({
      message: 'Logo uploaded successfully',
      logoPath: logoPath,
      filename: req.file.filename,
    });
  } catch (error) {
    const err = createHttpError(500, 'Error uploading file');
    next(err);
  }
});

module.exports = uploadRoute;
