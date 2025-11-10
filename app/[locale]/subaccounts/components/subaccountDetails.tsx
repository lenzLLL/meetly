'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { v4 } from 'uuid'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

import { Subaccount } from '@prisma/client'
import { upsertSubAccount } from '@/lib/action'
import { useEffect } from 'react'
import { useToast } from '@/components/ui/use_toast'
import { useModal } from './modal_provider'
import Loading from './loading'

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

interface SubAccountDetailsProps {
  details?: Subaccount
  userId?: string
  userName?: string
}

const SubAccountDetails: React.FC<SubAccountDetailsProps> = ({
  details,
  userId,
}) => {
  const { toast } = useToast()
  const { setClose } = useModal()
  const router = useRouter()

  // ✅ ALWAYS give safe default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: details?.name ?? '',
      email: details?.email ?? '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await upsertSubAccount({
        id: details?.id ?? v4(),
        email: values.email,
        name: values.name,
        userId:userId||"",
      })

      if (!response) throw new Error('No response from server')

      toast({
        title: 'Subaccount details saved',
        description: 'Successfully saved your subaccount details.',
      })

      setClose()
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Oppse!',
        description: 'Could not save sub account details.',
      })
    }
  }

  // ✅ Reset safely when details arrive
  useEffect(() => {
    if (details) {
      form.reset({
        name: details.name ?? '',
        email: details.email ?? '',
      })
    }
  }, [details, form])

  const isLoading = form.formState.isSubmitting

  return (
    <Card className="w-full !bg-[#1a0b2e]/70">
      <CardHeader>
        <CardTitle>Sub Account Information</CardTitle>
        <CardDescription>Please enter account's informations</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex md:flex-row gap-4">
              
              {/* NAME */}
            <FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem className="flex-1">
      <FormLabel>Account Name</FormLabel>
      <FormControl>
        <Input
          placeholder="Account Name"
          {...field}
          disabled={isLoading}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


          <FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem className="flex-1">
      <FormLabel>Account Email</FormLabel>
      <FormControl>
        <Input
          placeholder="Email"
          {...field}
          disabled={isLoading}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loading /> : 'Save Account Information'}
            </Button>

          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SubAccountDetails
