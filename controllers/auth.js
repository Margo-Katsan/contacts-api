const bcrypt = require("bcrypt")

const jwt = require("jsonwebtoken")

const gravavatar = require("gravatar")

const Jimp = require("jimp");

const path = require("path");

const fs = require("fs/promises")

const { HttpError, ctrlWrapper } = require("../helpers");

const { User } = require('../models/user');

const { SECRET_KEY } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars")

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email already in use")
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravavatar.url(email)
    const payload = {
    id: user._id
  }

  const newUser = await User.create({ ...req.body, password: hashPassword, avatarURL });
  const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23h"})
  await User.findByIdAndUpdate(user._id, { token })
  
  res.status(201).json({
    token,
    user: {
      name: newUser.name ?? '',
      email: newUser.email,
    }
    
  })
}

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user._id
  }
  const filteredUser = {
    name: user.name ?? '',
    email: user.email,
  }

  const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23h"})
  await User.findByIdAndUpdate(user._id, { token })
  
  res.json({
    token,
    user: filteredUser
  })
  
}

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  })
}

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, {token: "" });

  res.status(204).json({
    message: "Logout success"
  })
}

const updateSubscription = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, req.body, {new: true})
  
  res.json({
    message: "Update subscription success"
  })
}

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`
  const resultUpload = path.join(avatarsDir, filename);

  const image = await Jimp.read(tempUpload);
  await image.resize(250, 250).writeAsync(resultUpload);

  await fs.unlink(tempUpload);

  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({avatarURL})
}

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar)
}