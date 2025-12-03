import { createClient } from '@supabase/supabase-js'
import type { Database } from '@src/types/supabase'

const supabase = createClient<Database>(process.env.SUPABASE_API_URL!, process.env.SUPABASE_API_KEY!)

export default supabase