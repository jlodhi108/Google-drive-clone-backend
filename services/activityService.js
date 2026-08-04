// services/activityService.js

const Activity = require('../models/Activity');
const User = require('../models/User');
const mongoose = require('mongoose');

const activityService = {
  // Log a new activity
  createActivity: async (userId, action, targetId, targetModel, details = {}) => {
    try {
      const activity = new Activity({
        user: userId,
        action,
        target: targetId,
        targetModel,
        details
      });
      await activity.save();
      return activity;
    } catch (error) {
      console.error('Activity logging error:', error);
      throw new Error('Failed to log activity');
    }
  },

  // Get user activities with pagination
  getUserActivities: async (userId, options = {}) => {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    try {
      const activities = await Activity.find({ user: userId })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate('target', 'name')
        .lean();

      const totalCount = await Activity.countDocuments({ user: userId });

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get user activities error:', error);
      throw new Error('Failed to retrieve user activities');
    }
  },

  // Get activity details
  getActivityDetails: async (activityId, userId) => {
    try {
      const activity = await Activity.findOne({ _id: activityId, user: userId })
        .populate('user', 'name email')
        .populate('target', 'name')
        .lean();

      if (!activity) {
        throw new Error('Activity not found');
      }

      return activity;
    } catch (error) {
      console.error('Get activity details error:', error);
      throw new Error('Failed to retrieve activity details');
    }
  },

  // Delete an activity
  deleteActivity: async (activityId, userId) => {
    try {
      const result = await Activity.deleteOne({ _id: activityId, user: userId });
      if (result.deletedCount === 0) {
        throw new Error('Activity not found or user not authorized');
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      throw new Error('Failed to delete activity');
    }
  },

  // Get activity statistics
  getActivityStatistics: async (userId, startDate, endDate) => {
    try {
      const stats = await Activity.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Get activity statistics error:', error);
      throw new Error('Failed to retrieve activity statistics');
    }
  },

  // Get admin activities
  getAdminActivities: async (options = {}) => {
    const { page = 1, limit = 20, userId, action } = options;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;

    try {
      const activities = await Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('target', 'name')
        .lean();

      const totalCount = await Activity.countDocuments(query);

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get admin activities error:', error);
      throw new Error('Failed to retrieve admin activities');
    }
  },

  // Get recent activities
  getRecentActivities: async (userId, limit = 10) => {
    try {
      const activities = await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('target', 'name')
        .lean();

      return activities;
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw new Error('Failed to retrieve recent activities');
    }
  },

  // Get activities for a specific resource
  getResourceActivities: async (resourceId, options = {}) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    try {
      const activities = await Activity.find({ target: resourceId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean();

      const totalCount = await Activity.countDocuments({ target: resourceId });

      return {
        activities,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Get resource activities error:', error);
      throw new Error('Failed to retrieve resource activities');
    }
  },

  // Export activities
  exportActivities: async (userId, startDate, endDate, format = 'csv') => {
    try {
      const activities = await Activity.find({
        user: userId,
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).sort({ createdAt: -1 }).lean();

      if (format === 'csv') {
        // Implement CSV conversion logic here
        return convertToCSV(activities);
      } else if (format === 'json') {
        return JSON.stringify(activities);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export activities error:', error);
      throw new Error('Failed to export activities');
    }
  }
};

// Helper function to convert activities to CSV format
function convertToCSV(activities) {
  // Implement CSV conversion logic
  // This is a simplified example
  const header = 'Date,Action,Target\n';
  const rows = activities.map(a => 
    `${a.createdAt},${a.action},${a.targetModel}:${a.target}\n`
  ).join('');
  return header + rows;
}

module.exports = activityService;