const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema({
  path: { type: String },
  date: { type: Date, default: Date.now },
  userAgent: { type: String }

});


module.exports = mongoose.model("pageView", pageViewSchema);
