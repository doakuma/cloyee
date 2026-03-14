import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[Supabase] 환경변수 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. .env.local을 확인해주세요."
  );
}
if (!supabaseKey) {
  throw new Error(
    "[Supabase] 환경변수 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env.local을 확인해주세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: "pkce",
  },
});
