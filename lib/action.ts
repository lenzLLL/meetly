"use server"
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { Subaccount } from "@prisma/client";
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
        include:{
            subaccounts:true
        }
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

export const deleteSubAccount = async ({id}:{id:string}) =>{
    try{
        await prisma.subaccount.delete({
            where:{
                id
            }
        })
    }
    catch(error:any){
        return null
    }
}




export const upsertSubAccount = async (data: SubAccountInput) => {
  return prisma.subaccount.upsert({
    where: { id: data.id },
    update: {
      name: data.name,
      email: data.email,
    },
    create: {
      id: data.id,
      name: data.name,
      email: data.email,
      userId: data.userId,
    },
  })
}