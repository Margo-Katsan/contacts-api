const { HttpError, ctrlWrapper } = require("../helpers");

const { Contact } = require('../models/contact');

const Jimp = require("jimp");

const fs = require("fs/promises")

const path = require("path");

const avatarsDir = path.join(__dirname, "../", "public", "avatars", "contacts")

const getAll = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 10, favorite } = req.query;
  const skip = (page - 1) * limit;
  const filter = { owner };
  if (favorite) {
    filter.favorite = favorite
  }
  const result = await Contact.find(filter, "-createdAt -updatedAt", {skip, limit}).populate("owner", "name email");
  res.json(result);
}

const getById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findById(contactId);
  if (!result) {
    throw HttpError(404, "Not found")
  }
  res.json(result);
}

const add = async (req, res, next) => {
  const {_id: owner} = req.user
  const result = await Contact.create({ ...req.body, owner });
  res.status(201).json(result);
}

const deleteById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndRemove(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  if (result.avatarURL) {
    const avatarPath = path.join(__dirname, "../","public", result.avatarURL.split("/").pop());
    await fs.unlink(avatarPath);
  }
  res.json({
    message: "contact deleted"
  });
}

const updateById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
  if (!result) {
    throw HttpError(404, "Not found")
  }
  res.json(result);
}

const updateStatusContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
  if (!result) {
    throw HttpError(404, "Not found")
  }
  res.json(result);
}

const updateAvatar = async (req, res) => {
  const { contactId } = req.params;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${contactId}_${originalname}`
  const resultUpload = path.join(avatarsDir, filename);

  const image = await Jimp.read(tempUpload);
  await image.resize(250, 250).writeAsync(resultUpload);

  await fs.unlink(tempUpload);

  const avatarURL = path.join("avatars", "contacts", filename);
  await Contact.findByIdAndUpdate(contactId, { avatarURL });

  res.json({avatarURL})
}

module.exports = {
  getAll: ctrlWrapper(getAll),
  getById: ctrlWrapper(getById),
  add: ctrlWrapper(add),
  deleteById: ctrlWrapper(deleteById),
  updateById: ctrlWrapper(updateById),
  updateStatusContact: ctrlWrapper(updateStatusContact),
  updateAvatar: ctrlWrapper(updateAvatar)
}