const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const pageView = require("./models/pageView");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get("/", async (req, res) => {
  pageView.create({path:"/", userAgent:req.header("user-agent")},function(err){
    if (err) return console.error(err);
  })
  const notes = await Note.find();
  res.render("index",{ notes: notes } )
});

app.get("/notes/new", async (req, res) => {
  pageView.create({path:"/notes/new", userAgent:req.header("user-agent")},function(err){
    if (err) return console.error(err);
  })
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
  pageView.create({path:"/notes/"+req.params.id, userAgent:req.header("user-agent")},function(err){
    if (err) return console.error(err);
  })
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", async (req, res, next) => {
  pageView.create({path:"/notes/"+req.params.id+"/edit", userAgent:req.header("user-agent")},function(err){
    if (err) return console.error(err);
  })
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

app.get("/analytics", async (req, res) => {
  pageView.create({path:"/analytics", userAgent:req.header("user-agent")},function(err){
    if (err) return console.error(err);
  })

  const pageViews = await pageView.find();

  var paths = []; 

  for (var i = 0; i < pageViews.length; i++) {
    if(paths.indexOf(pageViews[i].path) == -1){
      paths.push(pageViews[i].path);
    }
  }

  var pathsCount = []; 

  for (var i = 0; i < paths.length; i++) {
    var count=0;
    for (var j = 0; j < pageViews.length; j++) {
      if(paths[i]==pageViews[j].path){
        count++;
      }
    }
    pathsCount.push(count);
  }

  desPaths=[];

  for (var i = 0; i < paths.length; i++) {
    desPaths.push({path: paths[i], count: pathsCount[i]});
  }

  var order = desPaths.sort(function (a, b) {
    if (a.count > b.count) {
      return 1;
    }
    if (a.count < b.count) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });
  var paths = order.reverse();

  res.render("visits", { paths: paths });

});

app.listen(3000, () => console.log("Listening on port 3000 ..."));
