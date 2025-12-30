"use server"
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
type SubAccountInput = {
  id: string
  name: string
  email: string
  userId: string
  clerkId?: string
}
export const SaveUserInTheDb = async () =>{
try{
    const user = await currentUser();
    if(!user){
        return {success:false}
    }
    const isUserExist = await prisma.user.findUnique({
        where:{
            id:user?.id||""
        }
    })
    if(isUserExist){
        return {success:true}
    }
     const email = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress
    const newUser = await prisma.user.create({
                data: {
                    id: user?.id||"",
                    clerkId: user?.id||"",
                    email: email,
                    name: `${user?.firstName} ${user?.lastName}`
                }
    })
    return {success:true}
}
catch(error:any){
    return {success:false}
}
 
}

export const getAuthUserDetails = async () =>{
try{
    const user = await currentUser();
    if(!user){
        return null
    }
    const isUserExist = await prisma.user.findUnique({
        where:{
            id:user?.id||""
        },
    })
    if(!isUserExist){
        return null
    }
    return isUserExist

    
}
catch(error:any){
    return null
}
 
}

// subaccount deletion removed



export const saveUserLang = async (lang:string) =>{
    try{
        const user = await currentUser();
        await prisma.user.update({
            where:{
                id:user?.id
            },
            data:{
                lang
            }
        })

    }
    catch(error:any){
        return null
    }
}




// subaccount upsert removed

export const getUserMeetings = async (id:string) => {
    try{
        const user = await prisma.user.findUnique({ where: { id } })
        const emailNorm = (user?.email || '').trim().toLowerCase()

        const meeting = await prisma.meeting.findMany({
            where: {
                OR: [
                    { user: { id } },
                    emailNorm ? { sharing: { has: emailNorm } } : undefined,
                ].filter(Boolean) as any[],
            },
            include: {
                user: true,
            },
            orderBy: { startTime: 'desc' },
        })

        // annotate returned meetings with shared metadata
        const annotated = meeting.map(m => ({
            ...m,
            shared: (m.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm),
            sharedBy: ((m.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm)) ? (m.user?.name || m.user?.email || null) : null,
        }))

        return annotated
    }
    catch(error:any){
        return null
    }
}