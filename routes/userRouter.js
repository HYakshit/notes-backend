import { Router } from "express";
import passport from "passport";
import supabase from "../config/supabase.js";

const userRouter = Router();

// User Registration
userRouter.post("/register", async (req, res) => {
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
        data: { display_name: displayName || email.split("@")[0] },
      },
    });

    if (error) return res.status(400).json({ message: error.message });

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to confirm your account.",
      user: data.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error",error: error.message});
  }
});

// User Login
userRouter.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json(info);

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json(user);
    });
  })(req, res, next);
});

//  Forgot Password
userRouter.post("/forgot-password", async (req, res) => {
  try {
     const email = req.body?.email;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.FRONTEND_URL || process.env.PRODUCTION_FRONTEND_URL
      }/reset-password`,
    });

    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password
userRouter.post("/reset-password", async (req, res) => {
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
    if (error) return res.status(400).json({ message: error.message });

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });
    if (updateError)
      return res.status(400).json({ message: updateError.message });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Current Authenticated User
userRouter.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json(req.user);
  }
  return res.status(401).json({ message: "Unauthorized" });
});

// Logout
userRouter.post("/logout", async (req, res) => {
  try {
    await supabase.auth.signOut();

    req.logout && req.logout(() => {});
    req.session?.destroy(() => {
      res.clearCookie("notesapp.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error during logout" });
  }
});

export default userRouter;
