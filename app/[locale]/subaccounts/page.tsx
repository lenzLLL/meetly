// app/subaccounts/page.tsx
import { getAuthUserDetails } from "@/lib/action"
import AllSubAccountsPage from "./components/subaccountAll"

export default async function Page() {
  const user = await getAuthUserDetails()
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]">
      <AllSubAccountsPage user={user} />
    </div>
  )
}
