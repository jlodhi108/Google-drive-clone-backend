// fileController.js
const File = require('../models/File');
const Folder = require('../models/Folder');
const SharedFile = require('../models/SharedFile');
const { upload } = require('../config/multer');
const s3Service = require('../services/s3Service');
const { createActivity } = require('../services/activityService');

// Upload a file
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const { folderId } = req.body;
      const folder = folderId ? await Folder.findById(folderId) : null;
      if (folderId && !folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      const { key } = await s3Service.uploadFile(req.file, req.user._id);
      const file = new File({
        name: req.file.originalname,
        originalName: req.file.originalname,
        path: key,
        size: req.file.size,
        mimeType: req.file.mimetype,
        owner: req.user._id,
        folder: folder ? folder._id : null
      });
      await file.save();
      await createActivity(req.user._id, 'upload', file._id, 'File');
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          name: file.name,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
  }
];
// Get all files for a user
exports.getUserFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = { owner: req.user._id, isDeleted: false };
    if (folderId) {
      query.folder = folderId;
    }
    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};
// Get a single file
exports.getFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
};
// Update file details
exports.updateFile = async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (name) file.name = name;
    await file.save();
    await createActivity(req.user._id, 'rename', file._id, 'File');
    res.json({ message: 'File updated successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error updating file', error: error.message });
  }
};
// Delete a file (soft delete — moves it to trash)
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    file.isDeleted = true;
    file.deletedAt = Date.now();
    await file.save();
    await createActivity(req.user._id, 'trash', file._id, 'File');
    res.json({ message: 'File moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};
// Restore a file from trash
exports.restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: true });
    if (!file) {
      return res.status(404).json({ message: 'File not found in trash' });
    }
    file.isDeleted = false;
    file.deletedAt = undefined;
    await file.save();
    await createActivity(req.user._id, 'restore', file._id, 'File');
    res.json({ message: 'File restored successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring file', error: error.message });
  }
};
// Permanently delete a file (only reachable from trash)
exports.permanentlyDeleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    await s3Service.deleteFile(file.path).catch(() => {});
    await File.deleteOne({ _id: file._id });
    await createActivity(req.user._id, 'delete', file._id, 'File');
    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting file', error: error.message });
  }
};
// Toggle star on a file
exports.toggleStarFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    file.starred = !file.starred;
    await file.save();
    await createActivity(req.user._id, file.starred ? 'star' : 'unstar', file._id, 'File');
    res.json({ message: 'File updated successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error starring file', error: error.message });
  }
};
// Get trashed files for a user
exports.getTrashedFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trashed files', error: error.message });
  }
};
// Get starred files for a user
exports.getStarredFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id, isDeleted: false, starred: true }).sort({ updatedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching starred files', error: error.message });
  }
};
// Get recently modified files for a user
exports.getRecentFiles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const files = await File.find({ owner: req.user._id, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(limit);
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent files', error: error.message });
  }
};
// Get total storage used by a user's non-deleted files
exports.getStorageUsage = async (req, res) => {
  try {
    const [result] = await File.aggregate([
      { $match: { owner: req.user._id, isDeleted: false } },
      { $group: { _id: null, usedBytes: { $sum: '$size' }, fileCount: { $sum: 1 } } }
    ]);
    res.json({ usedBytes: result?.usedBytes || 0, fileCount: result?.fileCount || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching storage usage', error: error.message });
  }
};
// Search files
exports.searchFiles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
      name: { $regex: query, $options: 'i' }
    }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error searching files', error: error.message });
  }
};
// Generate a short-lived S3 pre-signed download/view URL.
// mode=view renders the file inline (images/PDFs/text open in the browser tab);
// mode=download (default) forces a save-as dialog.
exports.getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const isOwner = file.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      const share = await SharedFile.findOne({ file: file._id, sharedWith: req.user._id });
      if (!share) {
        return res.status(403).json({ message: 'Not authorized to access this file' });
      }
    }
    const mode = req.query.mode === 'view' ? 'view' : 'download';
    const downloadUrl = await s3Service.getSignedUrl(file.path, {
      responseContentType: file.mimeType,
      responseContentDisposition: mode === 'view' ? 'inline' : `attachment; filename="${file.name}"`
    });
    res.json({ downloadUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generating download URL', error: error.message });
  }
};
