"use client";

import AppHeader from '@/components/Header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

function Pricing() {
  const { user } = useUser()
  const [loading, setLoading] = useState<string | null>(null)
  const t = useTranslations("Pricing")

  const plans = [
    {
      id: 'starter',
      name: t('Starter.name'),
      price: 9,
      priceId: 'price_1SJWsIJHqPwkzCA7402qxeJ9',
      description: t('Starter.description'),
      features: [
        t('Starter.features.0'),
        t('Starter.features.1'),
        t('Starter.features.2'),
        t('Starter.features.3'),
        t('Starter.features.4'),
      ],
      popular: false
    },
    {
      id: 'pro',
      name: t('Pro.name'),
      price: 29,
      priceId: 'price_1SJWuVJHqPwkzCA7V6Y4OcQt',
      description: t('Pro.description'),
      features: [
        t('Pro.features.0'),
        t('Pro.features.1'),
        t('Pro.features.2'),
        t('Pro.features.3'),
        t('Pro.features.4'),
        t('Pro.features.5'),
      ],
      popular: true
    },
    {
      id: 'premium',
      name: t('Premium.name'),
      price: 99,
      priceId: 'price_1SJWv5JHqPwkzCA7QXmV0r9o',
      description: t('Premium.description'),
      features: [
        t('Premium.features.0'),
        t('Premium.features.1'),
        t('Premium.features.2'),
        t('Premium.features.3'),
        t('Premium.features.4'),
        t('Premium.features.5'),
      ],
      popular: false
    },
  ]

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) return
    setLoading(priceId)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Failed to create checkout session')
    } catch (error) {
      console.error('subscription creation error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <AppHeader />
      <div className="sm:mt-0 container mx-auto px-4 sm:px-6 2xl:max-w-[1400px] py-16 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">
            {t('Title.part1')}{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {t('Title.part2')}
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
            {t('Subtitle')}
          </p>
        </div>

        <div className="mt-12 lg:mt-22 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isLoading = loading === plan.priceId
            return (
              <Card
                key={plan.id}
                className={`relative bg-[#1a0b2e]/70 overflow-visible flex flex-col justify-between ${
                  plan.popular ? 'border-purple-500 mt-0 lg:-mt-10 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 text-white">
                    {t('MostPopular')}
                  </Badge>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="mb-7">{plan.name}</CardTitle>
                  <span className="font-bold text-5xl">${plan.price}</span>
                </CardHeader>

                <CardDescription className="text-center w-11/12 mx-auto">
                  {plan.description}
                </CardDescription>

                <CardContent className="flex-1">
                  <ul className="mt-7 space-y-2.5 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex space-x-2">
                        <Check className="flex-shrink-0 mt-0.5 h-4 w-4 text-purple-400" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 hover:scale-[0.98] transition-all duration-150'
                        : 'hover:bg-purple-700/50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t('Processing')}
                      </>
                    ) : (
                      t('SubscribeButton', { plan: plan.name })
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default Pricing
