import {createClient as createSupabaseClient} from '@supabase/supabase-js'

// Cliente independente, usado exclusivamente na inscrição de um funcionário.
// Não recebe a sessão atual do administrador e nunca a substitui.
export function createRegistrationClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 if(!url||!key)throw new Error('Supabase não configurado')
 return createSupabaseClient(url,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
 })
}
