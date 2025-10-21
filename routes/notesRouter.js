import { Router } from "express";
import notesService from "../services/notesService.js";
import { ensureAuthenticated, getUserId } from "../middleware/userWare.js";

const notesRouter = Router();



// // Session info endpoint (for debugging)
// notesRouter.get("/", (req, res) => {
//   res.json({
//     message: "session data",
//     session: req.session,
//     sessionId: req.session.id,
//     user: req.user || null,
//   });
// });

// Get all notes for the authenticated user
notesRouter.get("/notes", ensureAuthenticated, getUserId, async (req, res) => {
  try {
    const notes = await notesService.getUserNotes(req.userId);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific note by ID
notesRouter.get(
  "/notes/:id",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const noteId = req.params.id;
      const note = await notesService.getNoteById(noteId, req.userId);
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      if (error.message === "Note not found") {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a new note
notesRouter.post("/notes", ensureAuthenticated, getUserId, async (req, res) => {
  try {
    const newNote = await notesService.createNote(req.body, req.userId);
    res.status(201).json({
      message: "Note created successfully",
      note: newNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    if (error.message === "Title and content are required") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update an existing note
notesRouter.put(
  "/notes/:id",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const noteId = req.params.id;
      const updatedNote = await notesService.updateNote(
        noteId,
        req.body,
        req.userId
      );
      res.json({
        message: "Note updated successfully",
        note: updatedNote,
      });
    } catch (error) {
      console.error("Error updating note:", error);
      if (error.message === "Note not found") {
        return res.status(404).json({ message: "Note not found" });
      }
      if (error.message === "Title and content are required") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Toggle pin status of a note
notesRouter.put(
  "/notes/:id/pin",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const noteId = req.params.id;
      const updatedNote = await notesService.togglePin(noteId, req.userId);
      res.json({
        message: "Note pin status updated",
        note: updatedNote,
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      if (error.message === "Note not found") {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete a note
notesRouter.delete(
  "/notes/:id",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const noteId = req.params.id;
      const deletedNote = await notesService.deleteNote(noteId, req.userId);
      res.json({
        message: `Note with id ${deletedNote.id} deleted successfully`,
        note: deletedNote,
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      if (error.message === "Note not found") {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Search notes
notesRouter.get(
  "/notes/search/:term",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const searchTerm = req.params.term;
      const notes = await notesService.searchNotes(req.userId, searchTerm);
      res.json(notes);
    } catch (error) {
      console.error("Error searching notes:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get notes by category
notesRouter.get(
  "/notes/category/:category",
  ensureAuthenticated,
  getUserId,
  async (req, res) => {
    try {
      const category = req.params.category;
      const notes = await notesService.getNotesByCategory(req.userId, category);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes by category:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default notesRouter;
