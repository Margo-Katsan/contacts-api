const express = require('express');

const ctrl = require('../../controllers/contacts');

const { validateBody, isValidId, authenticate, upload } = require('../../middlewares');

const { schemas } = require('../../models/contact')

const router = express.Router();

router.get('/', authenticate, ctrl.getAll);

router.get('/:contactId', authenticate, isValidId, ctrl.getById);

router.post('/', authenticate, ctrl.add);

router.delete('/:contactId', authenticate, isValidId, ctrl.deleteById);

router.put('/:contactId', authenticate, isValidId, validateBody(schemas.addSchema), ctrl.updateById);

router.patch('/:contactId/favorite', authenticate, isValidId, validateBody(schemas.updateFavoriteSchema), ctrl.updateStatusContact)

router.patch("/:contactId/avatar", authenticate, upload.single("avatar"), ctrl.updateAvatar)

module.exports = router;
