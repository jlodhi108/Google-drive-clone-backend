// routes/shareRoutes.js

const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { isAuthenticated } = require('../middlewares/auth');
const { validateShareCreation, validateShareUpdate } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for share creation
const shareCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 share creations per windowMs
  message: 'Too many shares created, please try again after 15 minutes'
});

// Share a file
router.post('/file', isAuthenticated, shareCreationLimiter, validateShareCreation, shareController.shareFile);

// Share a folder
router.post('/folder', isAuthenticated, shareCreationLimiter, validateShareCreation, shareController.shareFolder);

// Get shared files for a user
router.get('/files', isAuthenticated, shareController.getSharedFiles);

// Get shared folders for a user
router.get('/folders', isAuthenticated, shareController.getSharedFolders);

// Update file share permissions
router.put('/file/:shareId', isAuthenticated, validateShareUpdate, shareController.updateFileSharePermissions);

// Update folder share permissions
router.put('/folder/:shareId', isAuthenticated, validateShareUpdate, shareController.updateFolderSharePermissions);

// Remove file share
router.delete('/file/:shareId', isAuthenticated, shareController.removeFileShare);

// Remove folder share
router.delete('/folder/:shareId', isAuthenticated, shareController.removeFolderShare);

module.exports = router;
