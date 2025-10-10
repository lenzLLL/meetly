"use client"
import { SaveUserInTheDb } from "@/lib/action"
import React,{useEffect,useState} from "react"

export function useUser(){
     
  const saveUser = async () =>{
      await SaveUserInTheDb()
  }

  return {saveUser}
}