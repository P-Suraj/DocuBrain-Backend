const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  vector: {
    type: [Number],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
