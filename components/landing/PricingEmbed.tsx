"use client"

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useAuth, SignInButton } from '@clerk/nextjs'

export default function PricingEmbed() {
  const t = useTranslations('Pricing')
  const [loading, setLoading] = useState<string | null>(null)

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
      popular: false,
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
      popular: true,
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
      popular: false,
    },
  ]

  const { isSignedIn, isLoaded } = useAuth()

  const handleSubscribe = async (priceId: string, planName: string) => {
    // If user not signed in, store pending subscription and open Clerk modal (SignInButton)
    if (!isLoaded || !isSignedIn) {
      try {
        localStorage.setItem('pendingSubscription', JSON.stringify({ priceId, planName }))
      } catch (e) {
        console.warn('Could not persist pending subscription', e)
      }
      return
    }

    setLoading(priceId)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error('subscription creation error:', error)
    } finally {
      setLoading(null)
    }
  }

  // If user returned from sign-in with a pending subscription, resume it
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return
    try {
      const pending = localStorage.getItem('pendingSubscription')
      if (pending) {
        const { priceId, planName } = JSON.parse(pending)
        localStorage.removeItem('pendingSubscription')
        // resume subscription flow
        handleSubscribe(priceId, planName)
      }
    } catch (err) {
      console.error('Error resuming pending subscription', err)
    }
  }, [isLoaded, isSignedIn])

  return (
    <div className="relative z-10 container mx-auto px-4 sm:px-6 2xl:max-w-[1400px] py-12">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateZ(0deg); }
          50% { transform: translateY(-15px) rotateZ(1deg); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: -1000px 0; }
          50% { background-position: 1000px 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6), inset 0 0 30px rgba(168, 85, 247, 0.2); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .text-glow { text-shadow: 0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3); }
        .card-shimmer { position: relative; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 1000px 100%; animation: shimmer 3s infinite; }
      `}</style>
      {/* Embedded Pricing Header (kept) */}
      <div className="max-w-4xl mx-auto text-center mb-32 md:mb-36">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-violet-300 bg-clip-text text-transparent">
            {t('Title.part1')}
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
            {t('Title.part2')}
          </span>
        </h2>
        <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-2">
          {t('Subtitle')}
        </p>
      </div>

      {/* Pricing Cards (embedded) */}
      <div className="mt-32 md:mt-36 grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-12 items-stretch max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const isLoading = loading === plan.priceId
          const buttonClass = `w-full py-3 text-sm font-bold rounded-xl transition-all duration-300 transform ${
            plan.popular
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-violet-600/40 to-purple-600/40 text-white border border-violet-500/40'
          }`
          return (
            <div
              key={plan.id}
              className={`animate-fade-in ${plan.popular ? 'md:col-span-1 md:scale-105 md:-translate-y-8' : ''}`}
              style={{ animationDelay: `${0.2 + index * 0.08}s` }}
            >
              <div
                className={`relative h-full rounded-2xl border-2 overflow-visible transition-all duration-300 hover:scale-105 group ${
                  plan.popular
                    ? 'border-violet-500/80 bg-gradient-to-br from-violet-900/40 to-purple-900/40 backdrop-blur-xl glow-pulse'
                    : 'border-violet-500/30 bg-gradient-to-br from-violet-900/20 to-purple-900/20 hover:border-violet-500/60 hover:from-violet-900/30 hover:to-purple-900/30'
                }`}
              >
                {/* Shimmer effect */}
                <div className={`absolute inset-0 card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 px-8 py-3 rounded-full text-white font-black text-sm shadow-2xl animate-float flex items-center gap-2 whitespace-nowrap">
                        <span className="text-lg">👑</span>
                        <span className="tracking-wider">MOST POPULAR</span>
                        <span className="text-lg">⭐</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative z-10 p-6 pt-12 flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${
                      plan.popular ? 'from-violet-300 to-purple-300' : 'from-violet-200 to-purple-200'
                    } bg-clip-text text-transparent`}>{plan.name}</h3>
                    <p className="text-gray-400 text-sm h-12">{plan.description}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-violet-500/30">
                    <div className="flex items-baseline gap-2 justify-center mb-2">
                      <span className="text-5xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">${plan.price}</span>
                      <span className="text-gray-400 text-lg">/mo</span>
                    </div>
                    <p className="text-gray-500 text-xs text-center">Billed monthly</p>
                  </div>

                  <div className="flex-1 mb-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 group/item">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 group-hover/item:from-violet-400 group-hover/item:to-purple-400 transition-all">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <span className="text-gray-200 group-hover/item:text-white transition-colors text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isLoaded && isSignedIn ? (
                    <Button className={buttonClass} onClick={() => handleSubscribe(plan.priceId, plan.name)} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        t('SubscribeButton', { plan: plan.name })
                      )}
                    </Button>
                  ) : (
                    <div className="mt-0">
                      <SignInButton mode="modal">
                        <Button
                          className={buttonClass}
                          onClick={() => {
                            try {
                              localStorage.setItem('pendingSubscription', JSON.stringify({ priceId: plan.priceId, planName: plan.name }))
                            } catch (e) {
                              console.warn('Could not persist pending subscription', e)
                            }
                          }}
                        >
                          {t('SubscribeButton', { plan: plan.name })}
                        </Button>
                      </SignInButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
