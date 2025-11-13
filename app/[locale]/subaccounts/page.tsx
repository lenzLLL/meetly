// app/subaccounts/page.tsx
import { getAuthUserDetails } from "@/lib/action"
import AllSubAccountsPage from "./components/subaccountAll"

export default async function Page() {
  const user = await getAuthUserDetails()
  return <AllSubAccountsPage user={user} />
}
