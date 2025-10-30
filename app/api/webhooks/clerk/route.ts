import { NextRequest, NextResponse } from "next/server";
import {Webhook} from "svix"
import { prisma } from "@/lib/db";

export async function POST(request:NextRequest){
try{
    console.log('Webhook POST received');
 const payload = await request.text()
 const headers = {
            'svix-id': request.headers.get('svix-id') || '',
            'svix-timestamp': request.headers.get('svix-timestamp') || '',
            'svix-signature': request.headers.get('svix-signature') || '',
        }
           const webhookSecret = process.env.CLERK_SECRET_WEBHOOK 
        if (webhookSecret) {
            const wh = new Webhook(webhookSecret)
            try {
                wh.verify(payload, headers)
            } catch (err) {
                return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 })
            }
        }
                const event = JSON.parse(payload)
        console.log('clerk webhook received', event.type)

        if (event.type === 'user.created') {
            const { id, email_addresses, first_name, last_name } = event.data
            const primaryEmail = email_addresses?.find((email: any) =>
                email.id === event.data.primary_email_address_id
            )?.email_address

            const newUser = await prisma.user.create({
                data: {
                    id: id,
                    clerkId: id,
                    email: primaryEmail || null,
                    name: `${first_name} ${last_name}`
                }
            })
            console.log('user created', newUser.id, newUser.email)
            return NextResponse.json({ message: "user created successfully" })
        }
        else if (event.type === 'user.updated') {
  // Mettre à jour l'utilisateur
         }

    else if (event.type === 'user.deleted') {
  // Supprimer l'utilisateur
     }
        return NextResponse.json({ message: 'webhook received' })

}
catch(error:any){
        console.error('webhook error:', error)
        return NextResponse.json({ error: 'Webhook processign failed' }, { status: 500 })
}
}