
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Configuration
 * 
 * IMPORTANT: SUPABASE_PUBLIC_KEY must be the 'Anon' or 'Public' key from your dashboard.
 * It is a long string (JWT) that usually starts with 'eyJhb...'.
 */

const SUPABASE_URL = 'https://lbyypvqzluavzwwercvb.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_bPhZ7IMqKoTkEI0idQpS0w_OhDPEFM9';

// Quick check: Supabase keys are usually long JWTs. 
// If the key is too short or doesn't look like a JWT, sign-in/out might fail silently.
if (SUPABASE_PUBLIC_KEY.length < 50) {
  console.warn("WARNING: The SUPABASE_PUBLIC_KEY appears to be a placeholder or incorrect type. Supabase keys are typically long JWT strings.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
