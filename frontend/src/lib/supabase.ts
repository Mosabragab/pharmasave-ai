import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('sys_config')
      .select('key, value')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error }
    }
    
    console.log('✅ Supabase connected successfully!', data)
    return { success: true, data }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: err }
  }
}

// Database types (basic - we'll expand these later)
export type Database = {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string
          display_id: string | null
          name: string
          email: string | null
          phone: string | null
          status: 'pending_verification' | 'verified' | 'suspended' | 'deactivated'
          verified: boolean
          profile_completion_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
        }
      }
      pharmacists: {
        Row: {
          id: string
          auth_id: string
          pharmacy_id: string
          fname: string
          lname: string
          email: string
          role: 'primary_admin' | 'co_admin' | 'staff_pharmacist'
          is_primary: boolean
          profile_completion_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          pharmacy_id: string
          fname: string
          lname: string
          email: string
          role?: 'primary_admin' | 'co_admin' | 'staff_pharmacist'
        }
        Update: {
          fname?: string
          lname?: string
          phone?: string | null
          pharmacist_id_num?: string | null
        }
      }
      meds: {
        Row: {
          id: string
          name: string
          generic_name: string | null
          form: string
          strength: string | null
          manufacturer: string | null
          category: string | null
          prescription: boolean
          created_at: string
        }
      }
    }
  }
}
