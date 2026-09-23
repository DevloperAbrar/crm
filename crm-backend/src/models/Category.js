const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true },
    fieldType: { type: String, enum: ['text', 'number', 'date', 'dropdown'], required: true },
    options: [{ type: String }], // used when fieldType === 'dropdown'
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    colour: { type: String, default: '#4F46E5' },
    customFields: [customFieldSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
