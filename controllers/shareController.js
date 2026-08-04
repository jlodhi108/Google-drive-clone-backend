// shareController.js

const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const SharedFile = require('../models/SharedFile');
const SharedFolder = require('../models/SharedFolder');
const { createActivity } = require('../services/activityService');

// Share a file
exports.shareFile = async (req, res) => {
  try {
    const { fileId, email, permissions } = req.body;

    if (!fileId || !email || !permissions) {
      return res.status(400).json({ message: 'File ID, email, and permissions are required' });
    }

    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const sharedWith = await User.findOne({ email });
    if (!sharedWith) {
      return res.status(404).json({ message: 'User to share with not found' });
    }

    if (sharedWith._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot share with yourself' });
    }

    const existingShare = await SharedFile.findOne({ file: fileId, sharedWith: sharedWith._id });
    if (existingShare) {
      return res.status(400).json({ message: 'File already shared with this user' });
    }

    const sharedFile = new SharedFile({
      file: fileId,
      sharedBy: req.user._id,
      sharedWith: sharedWith._id,
      permissions
    });

    await sharedFile.save();
    await createActivity(req.user._id, 'share', fileId, 'File');

    res.status(201).json({ message: 'File shared successfully', sharedFile });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing file', error: error.message });
  }
};

// Share a folder
exports.shareFolder = async (req, res) => {
  try {
    const { folderId, email, permissions } = req.body;

    if (!folderId || !email || !permissions) {
      return res.status(400).json({ message: 'Folder ID, email, and permissions are required' });
    }

    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const sharedWith = await User.findOne({ email });
    if (!sharedWith) {
      return res.status(404).json({ message: 'User to share with not found' });
    }

    if (sharedWith._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot share with yourself' });
    }

    const existingShare = await SharedFolder.findOne({ folder: folderId, sharedWith: sharedWith._id });
    if (existingShare) {
      return res.status(400).json({ message: 'Folder already shared with this user' });
    }

    const sharedFolder = new SharedFolder({
      folder: folderId,
      sharedBy: req.user._id,
      sharedWith: sharedWith._id,
      permissions
    });

    await sharedFolder.save();
    await createActivity(req.user._id, 'share', folderId, 'Folder');

    res.status(201).json({ message: 'Folder shared successfully', sharedFolder });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing folder', error: error.message });
  }
};

// Get shared files for a user
exports.getSharedFiles = async (req, res) => {
  try {
    const sharedFiles = await SharedFile.find({ sharedWith: req.user._id })
      .populate('file')
      .populate('sharedBy', 'name email');

    res.json(sharedFiles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared files', error: error.message });
  }
};

// Get shared folders for a user
exports.getSharedFolders = async (req, res) => {
  try {
    const sharedFolders = await SharedFolder.find({ sharedWith: req.user._id })
      .populate('folder')
      .populate('sharedBy', 'name email');

    res.json(sharedFolders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared folders', error: error.message });
  }
};

// Update file share permissions
exports.updateFileSharePermissions = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { permissions } = req.body;

    const sharedFile = await SharedFile.findOne({ _id: shareId, sharedBy: req.user._id });
    if (!sharedFile) {
      return res.status(404).json({ message: 'Shared file not found' });
    }

    sharedFile.permissions = permissions;
    await sharedFile.save();

    res.json({ message: 'Share permissions updated successfully', sharedFile });
  } catch (error) {
    res.status(500).json({ message: 'Error updating share permissions', error: error.message });
  }
};

// Update folder share permissions
exports.updateFolderSharePermissions = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { permissions } = req.body;

    const sharedFolder = await SharedFolder.findOne({ _id: shareId, sharedBy: req.user._id });
    if (!sharedFolder) {
      return res.status(404).json({ message: 'Shared folder not found' });
    }

    sharedFolder.permissions = permissions;
    await sharedFolder.save();

    res.json({ message: 'Share permissions updated successfully', sharedFolder });
  } catch (error) {
    res.status(500).json({ message: 'Error updating share permissions', error: error.message });
  }
};

// Remove file share
exports.removeFileShare = async (req, res) => {
  try {
    const shareId = req.params.shareId;

    const sharedFile = await SharedFile.findOne({ _id: shareId, sharedBy: req.user._id });
    if (!sharedFile) {
      return res.status(404).json({ message: 'Shared file not found' });
    }

    await SharedFile.deleteOne({ _id: shareId });
    await createActivity(req.user._id, 'unshare', sharedFile.file, 'File');

    res.json({ message: 'File share removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing file share', error: error.message });
  }
};

// Remove folder share
exports.removeFolderShare = async (req, res) => {
  try {
    const shareId = req.params.shareId;

    const sharedFolder = await SharedFolder.findOne({ _id: shareId, sharedBy: req.user._id });
    if (!sharedFolder) {
      return res.status(404).json({ message: 'Shared folder not found' });
    }

    await SharedFolder.deleteOne({ _id: shareId });
    await createActivity(req.user._id, 'unshare', sharedFolder.folder, 'Folder');

    res.json({ message: 'Folder share removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing folder share', error: error.message });
  }
};