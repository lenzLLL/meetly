"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Users, Trash, Video } from "lucide-react"
import { useModal } from "../subaccounts/components/modal_provider"
import AttendeeList from "./attendees"
import { useToast } from "@/components/ui/use_toast"
import CustomModal from "../subaccounts/components/custom_modal"
import Link from "next/link"
import { useTranslations } from "next-intl"

export const meetingColumns = (t: ReturnType<typeof useTranslations>): ColumnDef<any>[] => [
  {
    accessorKey: "title",
    header: t("Title"),
  },
  {
    accessorKey: "description",
    header: t("Description"),
    cell: ({ row }) => (
      <div className="line-clamp-2 text-muted-foreground">
        {row.getValue("description") || t("NoDescription")}
      </div>
    ),
  },
  {
    id: "attendees",
    header: t("Attendees"),
    cell: ({ row }) => {
      const { setOpen } = useModal()
      const attendees: string[] = Array.isArray(row.original.attendees)
        ? row.original.attendees
        : row.original.attendees
        ? JSON.parse(String(row.original.attendees))
        : []

      const meetingData = {
        id: row.original.id,
        title: row.original.title,
        description: row.original.description ?? null,
      }

      return (
        <Button
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300"
          onClick={() =>
            setOpen(
              <CustomModal
                title={`${t("AttendeesFor")} "${meetingData.title}"`}
                subheading={t("ParticipantsList")}
              >
                <AttendeeList attendees={attendees} meeting={meetingData} />
              </CustomModal>
            )
          }
        >
          <Users size={16} className="mr-2" />
          {t("View")}
        </Button>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const { toast } = useToast()
      const t = useTranslations("Meetings")

      const deleteMeeting = async () => {
        await fetch(`/api/meetings/${row.original.id}`, { method: "DELETE" })
        toast({
          title: t("MeetingDeleted"),
          description: t("MeetingDeletedDescription"),
        })
        window.location.reload()
      }

      return (
        <div className="flex items-center gap-2">
          <Link className="cursor-pointer" href={`/meeting/${row.original.id}`}>
            <Button className="flex gap-2 cursor-pointer bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300">
              <Video size={15} />
              {t("View")}
            </Button>
          </Link>
          <Button size="sm" className="ml-2" onClick={deleteMeeting}>
            <Trash size={15} />
            {t("Delete")}
          </Button>
        </div>
      )
    },
  },
]
