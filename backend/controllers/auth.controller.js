
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const setToken = (res, id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

export const register = async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password || password.length < 8)
            return res.status(400).json({ message: "Invalid registration details" });

        const hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, phone)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, phone, role`,
            [full_name.trim(), email.trim().toLowerCase(), hash, phone || null]
        );

        const user = result.rows[0];
        setToken(res, user.id);

        res.status(201).json({ success: true, user });

    } catch (error) {
        res.status(error.code === "23505" ? 409 : 500).json({
            message: error.code === "23505" ? "Email already registered" : "Registration failed"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email?.trim().toLowerCase()]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password || "", user.password_hash)))
            return res.status(401).json({ message: "Invalid email or password" });

        setToken(res, user.id);

        res.json({
            success: true,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch {
        res.status(500).json({ message: "Login failed" });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.json({ success: true, message: "Logged out" });
};

export const getMe = async (req, res) => {
    const result = await pool.query(
        "SELECT id, full_name, email, phone, role FROM users WHERE id = $1",
        [req.user.id]
    );

    if (!result.rows.length)
        return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user: result.rows[0] });
};
