import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { meetingColumns } from "./column"
import DataTable from "./data-table"
import { getAuthUserDetails } from "@/lib/action"
import AppHeader from "@/components/Header"

export default async function MeetingsPage() {
   const user = await getAuthUserDetails()
      if(!user){
        return (<>
                <AppHeader/> 
                <div className="space-y-4 p-10">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="bg-[#130a22]/70 rounded-xl p-5 border border-white/5 animate-pulse"
                    >
                        <div className="h-5 bg-white/10 rounded w-48 mb-4"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3 mb-3"></div>
                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
            </>
        )
    }

  const dbUser = await prisma.user.findFirst({
    where: { clerkId: user.id },
    include: {
      meetings: {
        include: {
          permissions: true, // Subaccount[]
        },
      },
      subaccounts: true, // subaccounts du user
    },
  })

  let meetings = (dbUser?.meetings || []).map((m) => ({
    ...m,
    attendees: Array.isArray(m.attendees)
      ? m.attendees
      : m.attendees
      ? JSON.parse(String(m.attendees))
      : [],
    permissions: m.permissions ?? [],
    user: { subaccounts: dbUser?.subaccounts ?? [] },
  }))
  meetings = meetings.filter(m=>m.meetingEnded === true)
  return (
    <div>
      <AppHeader/>
    <div className="p-10">
    <h2 className="text-2xl font-bold text-foreground">Completed Meetings</h2>
    <DataTable
      columns={meetingColumns}
      data={meetings}
      filterValue="title"
    />
    </div>
    </div>
  )
}
