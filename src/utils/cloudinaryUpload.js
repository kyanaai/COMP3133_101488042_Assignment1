const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (stream, folder = "comp3133_assignment1") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.pipe(uploadStream);
  });
};

module.exports = { uploadToCloudinary };