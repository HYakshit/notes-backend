export function ensureAuthenticated (req, res, next)  {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to get user ID from session
export function getUserId(req, res, next) {
  if (req.user && req.user.id) {
    req.userId = req.user.id;
    return next();
  }
  return res.status(401).json({ message: "User ID not found in session" });
}
