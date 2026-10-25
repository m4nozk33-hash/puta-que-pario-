
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function serverSupabase() {
  const jar = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase não configurado')
  return createServerClient(url,key,{
    cookies:{
      getAll(){return jar.getAll()},
      setAll(items:{name:string;value:string;options?:Parameters<typeof jar.set>[2]}[]){
        try {items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}
      }
    }
  })
}
