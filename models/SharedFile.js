// models/SharedFile.js

const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
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
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
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
  }
}, {
  timestamps: true
});

// Index for faster queries
sharedFileSchema.index({ file: 1, sharedWith: 1 }, { unique: true });
sharedFileSchema.index({ sharedBy: 1 });
sharedFileSchema.index({ shareLink: 1 });

// Method to check if share has expired
sharedFileSchema.methods.hasExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Method to increment access count
sharedFileSchema.methods.incrementAccessCount = async function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  await this.save();
};

// Static method to find active shares for a user
sharedFileSchema.statics.findActiveSharesForUser = function(userId) {
  return this.find({
    sharedWith: userId,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).populate('file');
};

// Middleware to check and update expired shares
sharedFileSchema.pre('find', function() {
  this.where({
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
});

// Virtual for remaining time
sharedFileSchema.virtual('remainingTime').get(function() {
  if (!this.expiresAt) return null;
  return Math.max(0, this.expiresAt - new Date());
});

module.exports = mongoose.model('SharedFile', sharedFileSchema);