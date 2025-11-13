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
    <div className="">
      <AppHeader/>
      <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">{t("CompletedMeetings")}</h1>
      <MeetingTableClient meetings={meetings} />
      </div>
    </div>
  )
}
