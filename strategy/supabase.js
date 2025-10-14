import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { supabase } from "../config/supabase.js";

// Configure how user data is stored in the session
passport.serializeUser((user, done) => {
  done(null, user.id); // store only the user id in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user, error } = await supabase.auth.getUser();

    if (error || !user.user) {
      return done(new Error("User not found"));
    }

    // Return user data without sensitive information
    const { password, ...safeUser } = user.user;
    done(null, safeUser);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // Changed from username to email for Supabase
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return done(null, false, { message: error.message });
        }

        if (!data.user) {
          return done(null, false, { message: "Authentication failed" });
        }

        // Return user data without sensitive information
        const { password: _pw, ...safeUser } = data.user;
        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
