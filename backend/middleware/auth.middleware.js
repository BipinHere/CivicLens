
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) return res.status(401).json({ message: "Please login" });

        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const authorizeRoles = (...roles) => async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT role FROM users WHERE id = $1",
            [req.user.id]
        );

        if (!result.rows.length || !roles.includes(result.rows[0].role))
            return res.status(403).json({ message: "Access denied" });

        req.user.role = result.rows[0].role;
        next();
    } catch {
        res.status(500).json({ message: "Authorization failed" });
    }
};
