import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Map userId from token to id if present, to standardize
    if (decoded.userId && !decoded.id) {
        req.user.id = decoded.userId;
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
