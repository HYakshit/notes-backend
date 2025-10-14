import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting database migration...");

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.error("Statement:", statement);
        throw error;
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log("🎉 Database migration completed successfully!");

    // Verify the setup
    console.log("🔍 Verifying setup...");

    const { data: tables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "notes");

    if (tableError) {
      console.error("❌ Error verifying table creation:", tableError);
    } else if (tables && tables.length > 0) {
      console.log("✅ Notes table created successfully");
    } else {
      console.log("⚠️  Notes table not found");
    }

    // Check RLS policies
    const { data: policies, error: policyError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "notes");

    if (policyError) {
      console.error("❌ Error checking RLS policies:", policyError);
    } else if (policies && policies.length > 0) {
      console.log(`✅ ${policies.length} RLS policies created successfully`);
    } else {
      console.log("⚠️  No RLS policies found");
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
