// models/Folder.js

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [255, 'Folder name cannot be more than 255 characters']
  },
  path: {
    type: String,
    required: [true, 'Folder path is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#000000'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
folderSchema.index({ owner: 1, name: 1, parent: 1 });
folderSchema.index({ path: 1 });

// Virtual for getting child folders
folderSchema.virtual('childFolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for getting files in this folder
folderSchema.virtual('files', {
  ref: 'File',
  localField: '_id',
  foreignField: 'folder'
});

// Method to get full path
folderSchema.methods.getFullPath = async function() {
  let fullPath = this.name;
  let currentFolder = this;

  while (currentFolder.parent) {
    currentFolder = await this.model('Folder').findById(currentFolder.parent);
    fullPath = `${currentFolder.name}/${fullPath}`;
  }

  return fullPath;
};

// Static method to find folders by depth
folderSchema.statics.findByDepth = function(depth) {
  return this.aggregate([
    { $match: { isDeleted: false } },
    { $graphLookup: {
        from: 'folders',
        startWith: '$parent',
        connectFromField: 'parent',
        connectToField: '_id',
        as: 'ancestors'
    }},
    { $match: { $expr: { $eq: [{ $size: '$ancestors' }, depth] } } }
  ]);
};

module.exports = mongoose.model('Folder', folderSchema);