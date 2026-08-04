// services/searchService.js

const File = require('../models/File');
const Folder = require('../models/Folder');
const mongoose = require('mongoose');

const searchService = {
  // Search for files and folders
  search: async (userId, query, options = {}) => {
    const { type, sortBy, sortOrder, limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const baseQuery = {
      $and: [
        { owner: mongoose.Types.ObjectId(userId) },
        { $text: { $search: query } }
      ]
    };

    if (type && ['file', 'folder'].includes(type)) {
      baseQuery.type = type;
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.score = { $meta: 'textScore' };
    }

    try {
      const filePromise = File.find(baseQuery)
        .select('name path size mimeType createdAt updatedAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const folderPromise = Folder.find(baseQuery)
        .select('name path createdAt updatedAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const [files, folders] = await Promise.all([filePromise, folderPromise]);

      const totalCountPromise = File.countDocuments(baseQuery);
      const folderCountPromise = Folder.countDocuments(baseQuery);

      const [totalCount, folderCount] = await Promise.all([totalCountPromise, folderCountPromise]);

      return {
        results: [...files, ...folders],
        totalCount: totalCount + folderCount,
        page,
        limit
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search operation failed');
    }
  },

  // Advanced search with filters
  advancedSearch: async (userId, criteria) => {
    const { query, type, mimeType, sizeRange, dateRange, tags } = criteria;

    let baseQuery = { owner: mongoose.Types.ObjectId(userId) };

    if (query) {
      baseQuery.$text = { $search: query };
    }

    if (type && ['file', 'folder'].includes(type)) {
      baseQuery.type = type;
    }

    if (mimeType) {
      baseQuery.mimeType = new RegExp(mimeType, 'i');
    }

    if (sizeRange && (sizeRange.min || sizeRange.max)) {
      baseQuery.size = {};
      if (sizeRange.min) baseQuery.size.$gte = sizeRange.min;
      if (sizeRange.max) baseQuery.size.$lte = sizeRange.max;
    }

    if (dateRange && (dateRange.start || dateRange.end)) {
      baseQuery.createdAt = {};
      if (dateRange.start) baseQuery.createdAt.$gte = new Date(dateRange.start);
      if (dateRange.end) baseQuery.createdAt.$lte = new Date(dateRange.end);
    }

    if (tags && tags.length > 0) {
      baseQuery.tags = { $all: tags };
    }

    try {
      const results = await File.find(baseQuery)
        .select('name path size mimeType createdAt updatedAt tags')
        .sort({ createdAt: -1 })
        .lean();

      return results;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Advanced search operation failed');
    }
  },

  // Suggest completions for search queries
  suggestCompletions: async (userId, partialQuery, limit = 5) => {
    try {
      const regex = new RegExp(`^${partialQuery}`, 'i');
      const filePromise = File.find({ owner: userId, name: regex })
        .select('name')
        .limit(limit)
        .lean();

      const folderPromise = Folder.find({ owner: userId, name: regex })
        .select('name')
        .limit(limit)
        .lean();

      const [files, folders] = await Promise.all([filePromise, folderPromise]);

      const suggestions = [...files, ...folders]
        .map(item => item.name)
        .slice(0, limit);

      return suggestions;
    } catch (error) {
      console.error('Suggestion error:', error);
      throw new Error('Failed to get search suggestions');
    }
  },

  // Search within a specific folder
  searchInFolder: async (userId, folderId, query) => {
    try {
      const folder = await Folder.findOne({ _id: folderId, owner: userId });
      if (!folder) {
        throw new Error('Folder not found');
      }

      const regex = new RegExp(query, 'i');
      const filesPromise = File.find({ 
        owner: userId, 
        folder: folderId,
        name: regex 
      }).select('name path size mimeType createdAt updatedAt').lean();

      const foldersPromise = Folder.find({ 
        owner: userId, 
        parent: folderId,
        name: regex 
      }).select('name path createdAt updatedAt').lean();

      const [files, folders] = await Promise.all([filesPromise, foldersPromise]);

      return { files, folders };
    } catch (error) {
      console.error('Folder search error:', error);
      throw new Error('Search within folder failed');
    }
  }
};

module.exports = searchService;