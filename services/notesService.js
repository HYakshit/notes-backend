import { supabaseAdmin } from "../config/supabase.js";

class NotesService {
  // Get all notes for a user
  async getUserNotes(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      console.log("getUserNotes data:", data);
      if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`NotesService.getUserNotes: ${error.message}`);
    }
  }

  // Get a specific note by ID
  async getNoteById(noteId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Note not found");
        }
        throw new Error(`Failed to fetch note: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`NotesService.getNoteById: ${error.message}`);
    }
  }

  // Create a new note
  async createNote(noteData, userId) {
    try {
      const { title, content, category, tags } = noteData;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const newNote = {
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        category: category || "General",
        tags: tags || [],
        pinned: false,
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      };

      const { data, error } = await supabaseAdmin
        .from("notes")
        .insert([newNote])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create note: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`NotesService.createNote: ${error.message}`);
    }
  }

  // Update an existing note
  async updateNote(noteId, updateData, userId) {
    try {
      const { title, content, category, tags, pinned } = updateData;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const updateFields = {
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString(),
      };

      // Only update fields that are provided
      if (category !== undefined) updateFields.category = category;
      if (tags !== undefined) updateFields.tags = tags;
      if (pinned !== undefined) updateFields.pinned = pinned;

      const { data, error } = await supabaseAdmin
        .from("notes")
        .update(updateFields)
        .eq("id", noteId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Note not found");
        }
        throw new Error(`Failed to update note: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`NotesService.updateNote: ${error.message}`);
    }
  }

  // Toggle pin status of a note
  async togglePin(noteId, userId) {
    try {
      // First get the current note to check if it exists and get current pin status
      const currentNote = await this.getNoteById(noteId, userId);

      const { data, error } = await supabaseAdmin
        .from("notes")
        .update({
          pinned: !currentNote.pinned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to toggle pin: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`NotesService.togglePin: ${error.message}`);
    }
  }

  // Delete a note
  async deleteNote(noteId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Note not found");
        }
        throw new Error(`Failed to delete note: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`NotesService.deleteNote: ${error.message}`);
    }
  }

  // Search notes by title or content
  async searchNotes(userId, searchTerm) {
    try {
      const { data, error } = await supabaseAdmin
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to search notes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`NotesService.searchNotes: ${error.message}`);
    }
  }

  // Get notes by category
  async getNotesByCategory(userId, category) {
    try {
      const { data, error } = await supabaseAdmin
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch notes by category: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`NotesService.getNotesByCategory: ${error.message}`);
    }
  }
}

export default new NotesService();
