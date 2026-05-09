const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  content: { type: String, required: true, trim: true }
}, { timestamps: true });

messageSchema.index({ match_id: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
