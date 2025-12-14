import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { supabase, supabaseAdmin } from "../config/supabase.js";

// Configure how user data is stored in the session
passport.serializeUser((user, done) => {
  done(null, user.id); // store only the user id in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id);
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      console.error("Error fetching user in deserializeUser:", error);
      return done(new Error("User not found"));
    }

    const user = data?.user;

    if (!user) {
      console.error("User not found in deserializeUser (no data.user)");
      return done(new Error("User not found"));
    }

    // Return user data without sensitive information
    const { password, ...safeUser } = user;
    done(null, safeUser);
  } catch (error) {
    console.error("Exception in deserializeUser:", error);
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
