const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const NoteSchema = new mongoose.Schema({
  title: { type: String },
  body: { type: String }
});
NoteSchema.methods.truncateBody = function() {
  if (this.body && this.body.length > 75) {
    return this.body.substring(0, 70) + " ...";
  }
  return this.body;
};
const Note = mongoose.model("Note", NoteSchema);

app.get("/", async (req, res) => {
  const notes = await Note.find();
  res.render("index",{ notes: notes } )
});

app.get("/notes/new", async (req, res) => {
  const notes = await Note.find();
  res.render("new", { notes: notes });
});

app.post("/notes", async (req, res, next) => {
  const data = {
    title: req.body.title,
    body: req.body.body
  };

  const note = new Note(req.body);
  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.redirect('/');
});

app.get("/notes/:id", async (req, res) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", async (req, res, next) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("edit", { notes: notes, currentNote: note });
});

app.patch("/notes/:id", async (req, res) => {
  const id = req.params.id;
  const note = await Note.findById(id);

  note.title = req.body.title;
  note.body = req.body.body;

  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.status(204).send({});
});

app.delete("/notes/:id", async (req, res) => {
  await Note.deleteOne({ _id: req.params.id });
  res.status(204).send({});
});

app.listen(3000, () => console.log("Listening on port 3000 ..."));
