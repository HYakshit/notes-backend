import express from "express";
import cors from "cors";
import "dotenv/config";
import notes from "./notes.js";
const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mycloudnotes.netlify.app",
      "http://localhost:5174",
      "http://localhost:4000",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json());

//middleware to log requests
const idToIndex = (req, res, next) => {
  const id = req.params.id - 0;
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) {
    return res.status(404).send("Note not found");
  }
  req.noteIndex = index;
  next();
};

//get
app.get("/api/", (req, res) => {
  res.send("Hello welcome to notes home page");
});

app.get("/api/notes", (req, res) => {
  res.json(notes);
});

app.get("/api/notes/:id", idToIndex, (req, res) => {
  res.json(notes[req.noteIndex]);
});
//post
app.post("/api/notes", (req, res) => {
  const newNote = req.body;
  if (!newNote.title || !newNote.content) {
    return res.status(400).send("Title and content are required");
  }
  newNote.id = notes.length ? notes[notes.length - 1].id + 1 : 1;
  notes.push(newNote);
  res.status(201).send("Note created successfully");
});
//put
app.put("/api/notes/:id", idToIndex, (req, res) => {
  const updatedNote = req.body;
  if (!updatedNote.title || !updatedNote.content) {
    return res.status(400).send("Title and content are required");
  }
  const id = req.params.id - 0;
  const index = req.noteIndex;
  if (index === -1) {
    return res.status(404).send("Note not found");
  }

  notes[index] = { ...notes[index], ...updatedNote, id };
  res.status(200).json(updatedNote);
});
app.put("/api/notes/:id/pin", idToIndex, (req, res) => {
  const index = req.noteIndex;
  const newPinnedStatus = notes[index].pinned
    ? { pinned: false }
    : { pinned: true };
  const updatedNote = { ...notes[req.noteIndex], ...newPinnedStatus };

  const id = req.params.id - 0;

  if (index === -1) {
    return res.status(404).send("Note not found");
  }

  notes[index] = { ...notes[index], ...updatedNote, id };
  res.status(200).json(updatedNote);
});
//delete
app.delete("/api/notes/:id", idToIndex, (req, res) => {
  const note = notes[req.noteIndex];
  const index = req.noteIndex;
  notes.splice(index, 1);
  res.status(200).json(note);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
