export function ensureAuthenticated (req, res, next)  {
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("User authenticated");
    return next();
  }
  console.log("User not authenticated");
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to get user ID from session
export function getUserId(req, res, next) {
  if (req.user && req.user.id) {
    req.userId = req.user.id;
    console.log("User ID:", req.userId);
    return next();
  }
  console.log("User ID not found in session");
  return res.status(401).json({ message: "User ID not found in session" });
}
