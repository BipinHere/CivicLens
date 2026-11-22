
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { createServer } from "http";
import { initSocket } from "./config/socket.js";

dotenv.config();

const startServer = async () => {
    await connectDB();

    app.listen(process.env.PORT, () => {
        console.log(
            `CivicLens backend running on port ${process.env.PORT}`
        );
    });
};

startServer();

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to CivicLens API",
        status: "Server is running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "CivicLens Backend"
    });
});

const PORT = process.env.PORT || 5000;

const server = createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});