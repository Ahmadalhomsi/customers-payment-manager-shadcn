import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const source = process.env.SOURCE_DB_URL;
const target = process.env.TARGET_DB_URL;

// Step 1: Dump from source
exec(`pg_dump "${source}" > backup.sql`, (err) => {
  if (err) {
    console.error("Error dumping source DB:", err);
    return;
  }
  console.log("✅ Backup created: backup.sql");

  // Step 2: Restore into target
  exec(`psql "${target}" < backup.sql`, (err) => {
    if (err) {
      console.error("Error restoring into target DB:", err);
      return;
    }
    console.log("🎉 Restore completed into mp_customers");
  });
});
