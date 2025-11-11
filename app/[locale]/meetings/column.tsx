"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Users, Settings, Trash, Video } from "lucide-react"
import { useModal } from "../subaccounts/components/modal_provider"
import AttendeeList from "./attendees"
import PermissionsModal from "./permission.modal"
import { useToast } from "@/components/ui/use_toast"
import CustomModal from "../subaccounts/components/custom_modal"
import Link from "next/link"
export const meetingColumns: ColumnDef<any>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="line-clamp-2 text-muted-foreground">
        {row.getValue("description") || "No description"}
      </div>
    ),
  },
 {
  id: "attendees",
  header: "Attendees",
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
        variant="outline"
        onClick={() =>
          setOpen(
            <CustomModal
              title={`Attendees for "${meetingData.title}"`}
              subheading="List of participants"
            >
              <AttendeeList attendees={attendees} meeting={meetingData} />
            </CustomModal>
          )
        }
      >
        <Users size={16} className="mr-2" />
        View
      </Button>
    )
  },
},
 {
  id: "permissions",
  header: "Permissions",
  cell: ({ row }) => {
    const { setOpen } = useModal()
    const meeting = row.original

    return (
      <Button
        variant="outline"
        onClick={() =>
          setOpen(
            <PermissionsModal meetingId={meeting.id} />,
            async () => {
              // ✅ On récupère tout : meeting + user + subaccounts + permissions
              const res = await fetch(`/api/meetings/${meeting.id}`)
              const data = await res.json()

              // ✅ Doit retourner { meeting: {...} }
              return { meeting: data }
            }
          )
        }
      >
        <Settings size={16} className="mr-2" />
        Edit
      </Button>
    )
  },
},
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const { toast } = useToast()

      const deleteMeeting = async () => {
        await fetch(`/api/meetings/${row.original.id}`, { method: "DELETE" })
        toast({
          title: "Meeting Deleted",
          description: "The meeting has been removed.",
        })
        window.location.reload()
      }
   
      return (
        <div className="flex items-center gap-2">
           <Link className="cursor-pointer" href={`/meeting/${row.original.id}`}>
          <Button  className="flex gap-2 cursor-pointer" >
          <Video size={15} />
          View
        </Button>
        </Link>
        <Button variant="destructive" className="flex gap-2 cursor-pointer" onClick={deleteMeeting}>
          <Trash size={15} />
          Delete 
        </Button>
       </div>
      )
    },
  },
]
