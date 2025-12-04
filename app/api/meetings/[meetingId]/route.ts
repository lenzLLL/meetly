import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth()
        
        const { meetingId } = await params
        const user = await prisma.user.findUnique({
            where:{
                id:clerkUserId||""
            },
            include:{
                subaccounts:true
            }
        })
        let subaccounts = user?.subaccounts||[]
        const meeting = await prisma.meeting.findUnique({
            where: {
                id: meetingId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        clerkId: true,
                        
                    
                    },
                    
                },
                permissions:true
            }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }
        const responseData = {
            ...meeting,
            subaccounts,
            isOwner: clerkUserId === meeting.user?.clerkId
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('api error:', error)
        return NextResponse.json({ error: 'failed to fetch meeting' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
        }

                const { meetingId } = await params


        const meeting = await prisma.meeting.findUnique({
            where: {
                id: meetingId
            },
            include: {
                user: true
            }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        if (meeting.user.clerkId !== userId) {
            return NextResponse.json({ error: 'not authorized to delete this meeting' }, { status: 403 })
        }

        await prisma.meeting.delete({
            where: {
                id: meetingId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'meeting deleted succesfully'
        })

    } catch (error) {
        console.error('failed to delere meeting', error)
        return NextResponse.json({ error: 'failed to delete meeting' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
        }

        const { meetingId } = await params
        const body = await request.json()

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { user: true }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        if (meeting.user.clerkId !== userId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 403 })
        }

        const updateData: any = {}
        if (body.summary !== undefined) updateData.summary = body.summary
        if (body.actionItems !== undefined) updateData.actionItems = body.actionItems
        if (body.transcript !== undefined) updateData.transcript = body.transcript
        if (body.speakers !== undefined) updateData.speakers = body.speakers
        if (body.title !== undefined) updateData.title = body.title

        const updated = await prisma.meeting.update({
            where: { id: meetingId },
            data: updateData,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('failed to update meeting', error)
        return NextResponse.json({ error: 'failed to update meeting' }, { status: 500 })
    }
}