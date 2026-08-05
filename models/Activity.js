// models/Activity.js

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['upload', 'download', 'delete', 'rename', 'move', 'share', 'unshare', 'create_folder', 'delete_folder', 'trash', 'restore', 'star', 'unstar']
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel',
    required: true
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['File', 'Folder', 'SharedFile', 'SharedFolder']
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ action: 1 });
activitySchema.index({ target: 1 });

// Static method to get recent activities for a user
activitySchema.statics.getRecentActivities = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('target')
    .lean();
};

// Static method to get activity statistics
activitySchema.statics.getActivityStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Method to anonymize sensitive data
activitySchema.methods.anonymize = function() {
  this.ip = this.ip.split('.').slice(0, 2).join('.') + '.xxx.xxx';
  this.userAgent = 'Anonymized';
  return this;
};

module.exports = mongoose.model('Activity', activitySchema);