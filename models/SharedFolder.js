// models/SharedFolder.js

const mongoose = require('mongoose');

const sharedFolderSchema = new mongoose.Schema({
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'read'
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shareLink: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    select: false
  },
  includeSubfolders: {
    type: Boolean,
    default: true
  },
  lastAccessed: {
    type: Date
  },
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
sharedFolderSchema.index({ folder: 1, sharedWith: 1 }, { unique: true });
sharedFolderSchema.index({ sharedBy: 1 });
sharedFolderSchema.index({ shareLink: 1 });

// Method to check if share has expired
sharedFolderSchema.methods.hasExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Method to increment access count
sharedFolderSchema.methods.incrementAccessCount = async function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  await this.save();
};

// Static method to find active shares for a user
sharedFolderSchema.statics.findActiveSharesForUser = function(userId) {
  return this.find({
    sharedWith: userId,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).populate('folder');
};

// Middleware to check and update expired shares
sharedFolderSchema.pre('find', function() {
  this.where({
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
});

// Virtual for remaining time
sharedFolderSchema.virtual('remainingTime').get(function() {
  if (!this.expiresAt) return null;
  return Math.max(0, this.expiresAt - new Date());
});

module.exports = mongoose.model('SharedFolder', sharedFolderSchema);