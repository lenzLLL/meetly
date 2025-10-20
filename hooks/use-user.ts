"use client"
import { SaveUserInTheDb } from "@/lib/action"
import React,{useEffect,useState} from "react"

export function useUser(){
  const [isLoading,setIsLoading] = useState(false)  
  const saveUser = async () =>{
      setIsLoading(true)
      await SaveUserInTheDb()
      setIsLoading(false)
  }
  return {saveUser,isLoading}
}