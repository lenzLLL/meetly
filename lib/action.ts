"use server"
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const SaveUserInTheDb = async () =>{
    const u = await prisma.user.findUnique({
        where:{
            id:"dsf"
        }
    })
    if(u){
        return
    }
    const user = await currentUser();
    const newUser = await prisma.user.create({
                data: {
                    id: user?.id||"",
                    clerkId: user?.id||"",
                    email: user?.firstName|| null,
                    name: `${user?.firstName} ${user?.lastName}`
                }
    })
 
}