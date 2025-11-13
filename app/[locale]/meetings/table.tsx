"use client"

import { useTranslations } from "next-intl"
import { meetingColumns } from "./column"
import DataTable from "./data-table"
import AppHeader from "@/components/Header"

export default function MeetingTableClient({ meetings }: { meetings: any[] }) {
  const t = useTranslations("Meetings")
  const columns = meetingColumns(t) // ✅ côté client, autorisé

  return (
    <div>
    <DataTable columns={columns} data={meetings} filterValue="title" />
    </div>
  )
}
