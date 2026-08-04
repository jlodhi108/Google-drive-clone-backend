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
    const query = { owner: req.user._id };
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
// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    await s3Service.deleteFile(file.path).catch(() => {});
    await File.deleteOne({ _id: file._id });
    await createActivity(req.user._id, 'delete', file._id, 'File');
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
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
