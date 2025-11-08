import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
dotenv.config();
const supabaseUrl = 'https://hbznwqyjuspouyuwestl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error("Supabase key is missing. Please check your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
