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
      <div className="sm:mt-0 min-h-screen w-full bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 2xl:max-w-[1400px] py-20">
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
            .animate-float {
              animation: float 4s ease-in-out infinite;
            }
            .glow-pulse {
              animation: glow-pulse 3s ease-in-out infinite;
            }
            .text-glow {
              text-shadow: 0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3);
            }
            .card-shimmer {
              position: relative;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
              background-size: 1000px 100%;
              animation: shimmer 3s infinite;
            }
          `}</style>

          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h1 
              className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-glow"
              style={{ animationDelay: '0s' }}
            >
              <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-violet-300 bg-clip-text text-transparent drop-shadow-2xl">
                {t('Title.part1')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
                {t('Title.part2')}
              </span>
            </h1>
            
            <div className="flex gap-2 justify-center mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-1 w-12 bg-gradient-to-r from-violet-500 to-transparent rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-r from-violet-500 to-transparent rounded-full"></div>
            </div>

            <p 
              className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-2 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              {t('Subtitle')}
            </p>
            <p className="text-xs md:text-sm text-violet-300/60 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              Choose the perfect plan to supercharge your productivity
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 items-stretch max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isLoading = loading === plan.priceId
              return (
                <div
                  key={plan.id}
                  className={`animate-fade-in ${plan.popular ? 'md:col-span-1 md:scale-105 md:-translate-y-8' : ''}`}
                  style={{ animationDelay: `${0.8 + index * 0.15}s` }}
                >
                  <div
                    className={`relative h-full rounded-2xl border-2 overflow-visible transition-all duration-300 hover:scale-105 group ${
                      plan.popular
                        ? 'border-violet-500/80 bg-gradient-to-br from-violet-900/40 to-purple-900/40 backdrop-blur-xl glow-pulse'
                        : 'border-violet-500/30 bg-gradient-to-br from-violet-900/20 to-purple-900/20 hover:border-violet-500/60 hover:from-violet-900/30 hover:to-purple-900/30'
                    }`}
                  >
                    {/* Shimmer effect */}
                    <div className={`absolute inset-0 card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

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

                    <div className="relative z-10 p-8 pt-12 flex flex-col h-full">
                      {/* Plan title */}
                      <div className="mb-6">
                        <h3 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${
                          plan.popular 
                            ? 'from-violet-300 to-purple-300' 
                            : 'from-violet-200 to-purple-200'
                        } bg-clip-text text-transparent`}>
                          {plan.name}
                        </h3>
                        <p className="text-gray-400 text-sm h-12">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-8 pb-8 border-b border-violet-500/30">
                        <div className="flex items-baseline gap-2 justify-center mb-2">
                          <span className="text-5xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            ${plan.price}
                          </span>
                          <span className="text-gray-400 text-lg">/mo</span>
                        </div>
                        <p className="text-gray-500 text-xs text-center">Billed monthly</p>
                      </div>

                      {/* Features */}
                      <div className="flex-1 mb-8">
                        <ul className="space-y-4">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 group/item">
                              <div className="flex-shrink-0 mt-1">
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 group-hover/item:from-violet-400 group-hover/item:to-purple-400 transition-all">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                              <span className="text-gray-200 group-hover/item:text-white transition-colors text-sm leading-relaxed">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Button */}
                      <Button
                        className={`w-full py-6 text-base font-bold rounded-xl transition-all duration-300 transform ${
                          plan.popular
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg hover:shadow-violet-500/50 hover:scale-[1.03]'
                            : 'bg-gradient-to-r from-violet-600/40 to-purple-600/40 hover:from-violet-600/60 hover:to-purple-600/60 text-white border border-violet-500/40 hover:border-violet-500/70'
                        }`}
                        onClick={() => handleSubscribe(plan.priceId, plan.name)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          t('SubscribeButton', { plan: plan.name })
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-24 text-center animate-fade-in" style={{ animationDelay: '1.4s' }}>
            <p className="text-gray-300 mb-6 text-lg">Still unsure? We'd love to help! 💬</p>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 rounded-xl px-8 py-3 text-base font-semibold shadow-lg hover:shadow-violet-500/40 transition-all hover:scale-105">
              Schedule a Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center animate-fade-in" style={{ animationDelay: '1.6s' }}>
            <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-500/30">
              <p className="text-2xl font-bold text-violet-300">10K+</p>
              <p className="text-xs text-gray-400 mt-1">Happy Users</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-500/30">
              <p className="text-2xl font-bold text-violet-300">4.9⭐</p>
              <p className="text-xs text-gray-400 mt-1">Rating</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-500/30">
              <p className="text-2xl font-bold text-violet-300">24/7</p>
              <p className="text-xs text-gray-400 mt-1">Support</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Pricing
