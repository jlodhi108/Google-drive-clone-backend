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

// Get trashed folders
router.get('/trash', isAuthenticated, folderController.getTrashedFolders);

// Get starred folders
router.get('/starred', isAuthenticated, folderController.getStarredFolders);

// Get a single folder
router.get('/:id', isAuthenticated, folderController.getFolder);

// Update folder details
router.put('/:id', isAuthenticated, validateFolderUpdate, folderController.updateFolder);

// Delete a folder (moves it and its contents to trash)
router.delete('/:id', isAuthenticated, folderController.deleteFolder);

// Toggle star on a folder
router.patch('/:id/star', isAuthenticated, folderController.toggleStarFolder);

// Restore a folder from trash
router.post('/:id/restore', isAuthenticated, folderController.restoreFolder);

// Permanently delete a folder and its contents
router.delete('/:id/permanent', isAuthenticated, folderController.permanentlyDeleteFolder);

// Get folder contents (subfolders and files)
router.get('/:id/contents', isAuthenticated, folderController.getFolderContents);

module.exports = router;
