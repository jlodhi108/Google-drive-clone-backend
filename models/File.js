// models/File.js

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot be more than 255 characters']
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  publicUrl: {
    type: String
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ owner: 1, name: 1 });
fileSchema.index({ folder: 1 });

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.name.split('.').pop();
});

// Method to soft delete a file
fileSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  await this.save();
};

// Method to restore a soft-deleted file
fileSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  await this.save();
};

// Static method to find files by mime type
fileSchema.statics.findByMimeType = function(mimeType) {
  return this.find({ mimeType: new RegExp(mimeType, 'i') });
};

module.exports = mongoose.model('File', fileSchema);