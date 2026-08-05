// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password unless explicitly requested
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  storageLimit: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024 // 5GB in bytes
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.tokens;
      delete ret.refreshTokens;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpire;
      delete ret.otp;
      delete ret.otpExpires;
      return ret;
    }
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Implementation for password reset token generation
};

// Generate a 6-digit OTP and set its expiry
userSchema.methods.generateOtp = function() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

// Check whether a submitted OTP matches and hasn't expired
userSchema.methods.matchOtp = function(submittedOtp) {
  return !!this.otp && this.otp === submittedOtp && this.otpExpires && this.otpExpires > new Date();
};

// Check if user has enough storage
userSchema.methods.hasEnoughStorage = function(fileSize) {
  return (this.storageUsed + fileSize) <= this.storageLimit;
};

// Update storage used
userSchema.methods.updateStorageUsed = async function(size) {
  this.storageUsed += size;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);