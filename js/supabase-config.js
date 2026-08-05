/* ============================================================
   SUPABASE CONFIG
   ------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. Run the SQL in /supabase/schema.sql inside the Supabase
      SQL editor — this creates the `reviews` table and the
      security (RLS) policies described in README.md
   3. Go to Project Settings → API and copy your:
        - Project URL
        - anon / public key   (NOT the service_role key — never
          put the service_role key in front-end code)
   4. Paste them below.

   The anon key is safe to expose publicly — it only grants the
   permissions your RLS policies allow (public can submit a
   review and read approved ones; only a logged-in admin can
   read/approve pending ones). See supabase/schema.sql.
   ============================================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-PUBLIC-KEY';

// Formspree endpoint for the "Request a Quote" form.
// Create a free form at https://formspree.io, then paste its
// endpoint URL here, e.g. https://formspree.io/f/abcd1234
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR-FORM-ID';

let supabaseClient = null;
try{
  if(window.supabase && SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1){
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}catch(e){ console.warn('Supabase not configured yet:', e); }
