const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // Only the founder (admin) logs in with a password.
    // Team Leads / BDEs sign in with Google and have no password.
    passwordHash: {
      type: String,
      required: function () {
        return this.role === 'founder';
      },
    },
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ['founder', 'team_lead', 'bde'], required: true },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedStates: [{ type: String }],
    assignedCities: [{ type: String }],
    assignedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    dailyTarget: { type: Number, default: 20 },
    weeklyTarget: { type: Number, default: 100 },
    trustScore: { type: Number, default: 100 },
    stats: {
      callsMade: { type: Number, default: 0 },
      visitsMade: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, reportsTo: 1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);