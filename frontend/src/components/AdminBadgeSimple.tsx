// Quick Frontend Update to Show Admin IDs
// Add this to your admin panel to show AD0001 instead of PH0002

// In your admin header or profile component:
const getAdminDisplayId = async (supabase: any) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First check admin_users table
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('display_id, full_name, role')
    .eq('email', user.email)
    .single()

  if (adminData) {
    return {
      displayId: adminData.display_id, // Will show AD0001
      name: adminData.full_name,
      role: adminData.role
    }
  }

  // Fallback to old system
  return null
}

// Example usage in a component:
export function AdminBadge() {
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    getAdminDisplayId(supabase).then(setAdminInfo)
  }, [])

  if (!adminInfo) return null

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        <p className="font-semibold">{adminInfo.name}</p>
        <p className="text-gray-500">{adminInfo.displayId} • {adminInfo.role.toUpperCase()}</p>
      </div>
    </div>
  )
}

// This will display:
// Dr. Mosab
// AD0001 • SUPER_ADMIN