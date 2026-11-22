
import "dotenv/config";
import supabase from "./config/supabase.js";

try {
  const { data, error } = await supabase.storage.getBucket(
    process.env.SUPABASE_BUCKET
  );

  if (error) throw error;

  console.log("Supabase Storage connected!");
  console.log("Bucket:", data.name);
} catch (error) {
  console.error("Connection failed:", error.message);
}
