// routes/activityRoutes.js

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const { validateActivityQuery } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for activity retrieval
const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many activity requests, please try again after 15 minutes'
});

// Log an activity (typically called internally, not as an API endpoint)
router.post('/log', isAuthenticated, activityController.logActivity);

// Get user's activities
router.get('/', isAuthenticated, activityLimiter, validateActivityQuery, activityController.getUserActivities);

// Get activity statistics
router.get('/stats', isAuthenticated, validateActivityQuery, activityController.getActivityStatistics);

// Admin routes
router.get('/admin/all', isAuthenticated, isAdmin, validateActivityQuery, activityController.getAdminActivities);
router.get('/admin/stats', isAuthenticated, isAdmin, validateActivityQuery, activityController.getAdminActivityStatistics);

// Get recent activities
router.get('/recent', isAuthenticated, activityController.getRecentActivities);

// Get activities for a specific resource (file or folder)
router.get('/resource/:resourceId', isAuthenticated, activityController.getResourceActivities);

// Get activities by type
router.get('/type/:activityType', isAuthenticated, validateActivityQuery, activityController.getActivitiesByType);

// Export activities (e.g., as CSV)
router.get('/export', isAuthenticated, validateActivityQuery, activityController.exportActivities);

// Get unread activity count
router.get('/unread/count', isAuthenticated, activityController.getUnreadActivityCount);

// Mark activity as read
router.post('/:id/read', isAuthenticated, activityController.markActivityAsRead);

// Get activity details
router.get('/:id', isAuthenticated, activityController.getActivityDetails);

// Delete an activity (if allowed)
router.delete('/:id', isAuthenticated, activityController.deleteActivity);

module.exports = router;