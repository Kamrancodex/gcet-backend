import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        name: string;
        studentId?: string;
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env["JWT_SECRET"]!) as any;
    // Ensure consistent field naming - JWT contains 'id', but interface expects 'userId'
    req.user = {
      ...decoded,
      userId: decoded.id || decoded.userId, // Map 'id' to 'userId' for consistency
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireStudent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "student") {
    res.status(403).json({ error: "Student access required" });
    return;
  }

  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!["admin", "admissions_admin", "library_admin"].includes(req.user.role)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
};
