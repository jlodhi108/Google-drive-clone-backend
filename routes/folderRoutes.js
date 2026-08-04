// routes/folderRoutes.js

const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { isAuthenticated } = require('../middlewares/auth');
const { validateFolderCreation, validateFolderUpdate } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for folder creation
const folderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 folder creations per windowMs
  message: 'Too many folders created, please try again after 15 minutes'
});

// Create a new folder
router.post('/', isAuthenticated, folderCreationLimiter, validateFolderCreation, folderController.createFolder);

// Get all folders for a user
router.get('/', isAuthenticated, folderController.getUserFolders);

// Search folders
router.get('/search', isAuthenticated, folderController.searchFolders);

// Get a single folder
router.get('/:id', isAuthenticated, folderController.getFolder);

// Update folder details
router.put('/:id', isAuthenticated, validateFolderUpdate, folderController.updateFolder);

// Delete a folder
router.delete('/:id', isAuthenticated, folderController.deleteFolder);

// Get folder contents (subfolders and files)
router.get('/:id/contents', isAuthenticated, folderController.getFolderContents);

module.exports = router;
