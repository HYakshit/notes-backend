import express from "express";
import cors from "cors";
import "dotenv/config";
import notesRouter from "./utills/notesRouter.js";
import session from "express-session";
import passport from "passport";
import "./strategy/supabase.js";
import { supabase, supabaseAdmin } from "./config/supabase.js";
const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// Configure CORS for production and development
const allowedOrigins = isProduction
  ? [
      process.env.PRODUCTION_FRONTEND_URL,
      "https://mycloudnotes.netlify.app",
          "http://localhost:5173/",
      "https://mycloudnotes.netlify.app",
      "http://localhost:5174",
      "http://localhost:4000",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ].filter(Boolean)
  : [
      "http://localhost:5173",
      "https://mycloudnotes.netlify.app",
      "http://localhost:5174",
      "http://localhost:4000",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// session middleware , it shall always before endpoints
app.use(
  session({
    secret: process.env.SESSION_SECRET || (isProduction ? null : "mysecret"),
    resave: false,
    saveUninitialized: false, // Changed to false for security
    name: "notesapp.sid", // Custom session name
    // For cross-site cookies with a frontend on another origin
    cookie: {
      secure: isProduction, // requires HTTPS in production
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(express.json());
// If behind a proxy (Render/Heroku), enable to set secure cookies
app.set("trust proxy", 1);
app.use(passport.initialize());
app.use(passport.session()); // attaches user obj to req if logged in
// Health check endpoint for production monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    session: req.session,
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api", notesRouter);
// User registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to confirm your account.",
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// User login endpoint
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json(info);
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json(user);
    });
  })(req, res, next);
});

// Forgot password endpoint
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.FRONTEND_URL || process.env.PRODUCTION_FRONTEND_URL
      }/reset-password`,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset password endpoint
app.post("/api/reset-password", async (req, res) => {
  try {
    const { access_token, refresh_token, new_password } = req.body;

    if (!access_token || !refresh_token || !new_password) {
      return res.status(400).json({
        message: "Access token, refresh token, and new password are required",
      });
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return res.status(400).json({ message: updateError.message });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Return current authenticated user
app.get("/api/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json(req.user);
  }
  return res.status(401).json({ message: "Unauthorized" });
});

// Destroy session and logout
app.post("/api/logout", async (req, res) => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Destroy local session
    req.logout && req.logout(() => {});
    req.session?.destroy(() => {
      res.clearCookie("notesapp.sid");
      return res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error during logout" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: isProduction ? "Internal server error" : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
