// routes/fileRoutes.js

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { isAuthenticated } = require('../middlewares/auth');
const { validateFileUpdate } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 uploads per windowMs
  message: 'Too many file uploads, please try again after 15 minutes'
});

// File upload
router.post('/upload', isAuthenticated, uploadLimiter, fileController.uploadFile);

// Get all files for a user
router.get('/', isAuthenticated, fileController.getUserFiles);

// Search files
router.get('/search', isAuthenticated, fileController.searchFiles);

// Get trashed files
router.get('/trash', isAuthenticated, fileController.getTrashedFiles);

// Get starred files
router.get('/starred', isAuthenticated, fileController.getStarredFiles);

// Get recently modified files
router.get('/recent', isAuthenticated, fileController.getRecentFiles);

// Get total storage used
router.get('/storage-usage', isAuthenticated, fileController.getStorageUsage);

// Get a single file
router.get('/:id', isAuthenticated, fileController.getFile);

// Update file details
router.put('/:id', isAuthenticated, validateFileUpdate, fileController.updateFile);

// Delete a file (moves it to trash)
router.delete('/:id', isAuthenticated, fileController.deleteFile);

// Toggle star on a file
router.patch('/:id/star', isAuthenticated, fileController.toggleStarFile);

// Restore a file from trash
router.post('/:id/restore', isAuthenticated, fileController.restoreFile);

// Permanently delete a file
router.delete('/:id/permanent', isAuthenticated, fileController.permanentlyDeleteFile);

// Generate download URL (a real S3 pre-signed URL — the browser hits S3 directly)
router.get('/:id/download', isAuthenticated, fileController.getDownloadUrl);

module.exports = router;
