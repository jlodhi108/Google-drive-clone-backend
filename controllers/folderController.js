// folderController.js

const Folder = require('../models/Folder');
const File = require('../models/File');
const { createActivity } = require('../services/activityService');

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    let path = name;
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, owner: req.user._id });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
      path = `${parentFolder.path}/${name}`;
    }

    const folder = new Folder({
      name,
      path,
      owner: req.user._id,
      parent: parentId || null
    });

    await folder.save();
    await createActivity(req.user._id, 'create_folder', folder._id, 'Folder');

    res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error creating folder', error: error.message });
  }
};

// Get all folders for a user
exports.getUserFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const query = { owner: req.user._id };
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null; // Root folders
    }

    const folders = await Folder.find(query).sort({ name: 1 });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folders', error: error.message });
  }
};

// Get a single folder
exports.getFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folder', error: error.message });
  }
};

// Update folder details
exports.updateFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (name) {
      const oldPath = folder.path;
      const newPath = folder.path.replace(folder.name, name);
      folder.name = name;
      folder.path = newPath;

      // Update paths of all subfolders and files (aggregation-pipeline update,
      // required for $function to be evaluated instead of stored literally)
      await Folder.updateMany(
        { path: { $regex: `^${oldPath}/` } },
        [{ $set: { path: { $function: {
          body: `function(path) { return path.replace("${oldPath}/", "${newPath}/"); }`,
          args: ["$path"],
          lang: "js"
        } } } }]
      );

      await File.updateMany(
        { path: { $regex: `^${oldPath}/` } },
        [{ $set: { path: { $function: {
          body: `function(path) { return path.replace("${oldPath}/", "${newPath}/"); }`,
          args: ["$path"],
          lang: "js"
        } } } }]
      );
    }

    await folder.save();
    await createActivity(req.user._id, 'rename', folder._id, 'Folder');

    res.json({ message: 'Folder updated successfully', folder });
  } catch (error) {
    res.status(500).json({ message: 'Error updating folder', error: error.message });
  }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Delete all subfolders
    await Folder.deleteMany({ path: { $regex: `^${folder.path}/` } });

    // Delete all files in this folder and subfolders
    await File.deleteMany({ path: { $regex: `^${folder.path}/` } });

    // Delete the folder itself
    await Folder.deleteOne({ _id: folder._id });

    await createActivity(req.user._id, 'delete_folder', folder._id, 'Folder');

    res.json({ message: 'Folder and its contents deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting folder', error: error.message });
  }
};

// Search folders
exports.searchFolders = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const folders = await Folder.find({
      owner: req.user._id,
      name: { $regex: query, $options: 'i' }
    }).sort({ name: 1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error searching folders', error: error.message });
  }
};

// Get folder contents (subfolders and files)
exports.getFolderContents = async (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const subfolders = await Folder.find({ parent: folderId }).sort({ name: 1 });
    const files = await File.find({ folder: folderId }).sort({ name: 1 });

    res.json({
      folder,
      contents: {
        subfolders,
        files
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folder contents', error: error.message });
  }
};