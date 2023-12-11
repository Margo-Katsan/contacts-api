const { Schema, model } = require('mongoose');
const Joi = require('joi');
const { handleMongooseError } = require("../helpers");

const contactSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
  },
  phone: {
    type: String,
    required: [true, 'Set phone for contact']
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  avatarURL: String,
  birthday: {
    type: Date,
  },
  nextBirthday: {
    type: Date,
  }
}, { versionKey: false, timestamps: true });

contactSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  birthday: Joi.date().format('YYYY-MM-DD').utc(),
  favorite: Joi.boolean()
})

const updateSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string(),
  birthday: Joi.date().format('YYYY-MM-DD').utc(),
})

const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required()
})

const schemas = {
  addSchema,
  updateFavoriteSchema,
  updateSchema
}

const Contact = model("contact", contactSchema);

module.exports = {
  Contact,
  schemas
}