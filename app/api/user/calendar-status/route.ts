import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ connected: false })
        }
        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId
            },
            select: {
                calendarConnected: true,
                googleAccessToken: true,
                id:true
            }
        })
        const zoom =await  prisma.userIntegration.findFirst({
            where:{
                userId:user?.id,
                platform:"zoom"
            }
        })
        let z = !!zoom
        const outlook = await prisma.userIntegration.findFirst({
            where:{
                userId:user?.id,
                platform:"outlook"
            }
        })
        let o = !!outlook
        let g = user?.calendarConnected && !!user.googleAccessToken
        console.log(o)
        console.log(z)
        console.log(g)
        console.log(g || z || o)
        return NextResponse.json({
            connected: g || z || o,
            g,
            z,
            o
        })
    } catch (error) {
        return NextResponse.json({ connected: false })
    }
}