
import { Server } from "socket.io";
import { Client } from "pg";
import jwt from "jsonwebtoken";
import pool from "./db.js";

let io;

// Initialize Socket.IO
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  // Authenticate users through JWT cookie
  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie || "";
      const token = cookies.match(/(?:^|;\s*)token=([^;]+)/)?.[1];

      if (!token) throw new Error("Unauthorized");

      const decoded = jwt.verify(
        decodeURIComponent(token),
        process.env.JWT_SECRET
      );

      const result = await pool.query(
        "SELECT id FROM users WHERE id=$1",
        [decoded.id]
      );

      if (!result.rows.length) throw new Error("User not found");

      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  // Join private user room
  io.on("connection", (socket) => {
    socket.join(socket.userId);
    console.log("User connected:", socket.userId);
  });

  // Listen for PostgreSQL notification events
  const listener = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  listener.on("notification", ({ payload }) => {
    try {
      const notification = JSON.parse(payload);

      io.to(notification.user_id).emit(
        "new-notification",
        notification
      );
    } catch (error) {
      console.error("Notification delivery error:", error.message);
    }
  });

  listener.on("error", (error) => {
    console.error("PostgreSQL listener error:", error.message);
  });

  listener.connect()
    .then(() => listener.query("LISTEN new_notification"))
    .then(() => console.log("Notification listener connected"))
    .catch(error => console.error("Listener connection failed:", error.message));

  return io;
};

// Send notification directly to a user
export const sendNotification = (userId, notification) => {
  io?.to(userId).emit("new-notification", notification);
};
