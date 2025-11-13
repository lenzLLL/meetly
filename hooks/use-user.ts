"use client"
import { getAuthUserDetails, SaveUserInTheDb, saveUserLang } from "@/lib/action"
import React,{useEffect,useState} from "react"

export function useUsers(){
  const [isLoading,setIsLoading] = useState(false)  
  const [lang,setLang] = useState('')
  const saveUser = async () =>{
      setIsLoading(true)
      await SaveUserInTheDb()
      setIsLoading(false)
  }
  const getLang = async () => {
      const lang = await getAuthUserDetails()
      setLang(lang?.lang||"")
  }
  const saveLang = async (lang:string) =>{
      setIsLoading(true)
      await saveUserLang(lang)  
      setIsLoading(false)
  }
  useEffect(
    ()=>{
        getLang()
    },[isLoading]
  )
  return {saveUser,isLoading,lang,saveLang}
}