"use server"
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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