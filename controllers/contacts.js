const { error } = require("console");
const { HttpError, ctrlWrapper } = require("../helpers");

const { Contact } = require('../models/contact');



const fs = require("fs/promises")



const cloudinary = require("cloudinary").v2;



const {CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET}=process.env
      
cloudinary.config({ 
  cloud_name: CLOUDINARY_CLOUD_NAME, 
  api_key: CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET
});

const setNextBirthday = (birthday, req) => {

    const today = new Date();
    
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const birthdayMonth = birthday.getMonth() + 1;
    const todayDay = today.getDate();
    const birthdayDay = birthday.getDate();
 
    if (todayMonth === birthdayMonth) {
      
      if (todayDay - birthdayDay > 0) {
        req.body.nextBirthday = `${todayYear+1}-${birthdayMonth}-${birthdayDay}`
      }
      else {
        req.body.nextBirthday = `${todayYear}-${birthdayMonth}-${birthdayDay}`
      }
    }
    if (todayMonth - birthdayMonth > 0) {
      req.body.nextBirthday = `${todayYear+1}-${birthdayMonth}-${birthdayDay}`
    }
    else {
      req.body.nextBirthday = `${todayYear}-${birthdayMonth}-${birthdayDay}`
    }
}

const getAll = async (req, res, next) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 10, favorite, sort } = req.query;
  const skip = (page - 1) * limit;
  const filter = { owner };
  let result;
  if (favorite) {
    filter.favorite = favorite
  }
 
    switch(sort) {
      case "name":
        result = await Contact.find(filter, "-createdAt -updatedAt", { skip, limit }).populate("owner", "name email").sort({name: 1})
        break;
      case "last":
        result = await Contact.find(filter, "-createdAt -updatedAt", { skip, limit }).populate("owner", "name email").sort({createdAt: -1})
        break;
      
      case "birthday":
        result = await Contact.find(filter, "-createdAt -updatedAt", { skip, limit }).populate("owner", "name email").sort({nextBirthday: 1})
        break;
      default:
        result = await Contact.find(filter, "-createdAt -updatedAt", { skip, limit }).populate("owner", "name email");
        break;

  }
  
  
  
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
  const { _id: owner } = req.user
  
  if (req.body.birthday) {
    setNextBirthday(new Date(req.body.birthday), req);
  }
  
  else {
    req.body.nextBirthday = `${new Date().getFullYear() + 2}`
  }

  const result = await Contact.create({ ...req.body, owner });
  res.status(201).json(result);
}

const deleteById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndRemove(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }

    const parts = result.avatarURL.split('/');

    const publicId = parts[parts.length - 1];
    const withoutFileExtension = publicId.split('.')[0];
    
  await cloudinary.uploader.destroy(`contacts_avatars/${withoutFileExtension}`, { type: 'upload', resource_type: 'image' })

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
const withoutFileExtension = filename.split('.')[0];

  await cloudinary.uploader.upload(tempUpload, {
    upload_preset: "v2zggqv6",
    public_id: withoutFileExtension ,
    allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'ico', 'jfif', 'webp', 'gif']

  }, async (error, result) => {
    try {
     
      if (error) {
        throw HttpError(404, "A")
      }
    await fs.unlink(tempUpload);


      const updatedContact = await Contact.findByIdAndUpdate(contactId, { avatarURL: result.url }, {new: true});
      
  res.json(updatedContact)
    }
    catch (error) {
      
    }
    
  
});



  
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