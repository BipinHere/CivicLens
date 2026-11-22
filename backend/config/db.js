
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.on("connect", () => {
    console.log("PostgreSQL client connected");
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

export const connectDB = async () => {
    try {
        const result = await pool.query(`
            SELECT
                current_database(),
                current_user,
                PostGIS_Full_Version();
        `);

        console.log("PostgreSQL connected successfully!");
        console.log("Database:", result.rows[0].current_database);
        console.log("User:", result.rows[0].current_user);
        console.log("PostGIS is ready!");

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

export default pool;
