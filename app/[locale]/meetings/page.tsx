// app/[locale]/meetings/page.tsx
import { getAuthUserDetails, getUserMeetings } from "@/lib/action"
import { getTranslations } from "next-intl/server"
import MeetingTableClient from "./table"
import AppHeader from "@/components/Header"

export default async function MeetingsPage() {
  const t = await getTranslations("Meetings")
  const user = await getAuthUserDetails()
  let id = user?.id ? user.id:""
  const meetings = await getUserMeetings(id)||[]
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]">
      <AppHeader/>
      <div className="p-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">{t("CompletedMeetings")}</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mt-3"></div>
        </div>
      <MeetingTableClient meetings={meetings} />
      </div>
    </div>
  )
}
