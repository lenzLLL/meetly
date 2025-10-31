"use client"
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { ArrowRight, Bot, CheckCircle, ChevronRight, Menu, Play, Sparkles } from 'lucide-react'
import React,{use, useState} from 'react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from "next/navigation";
import LanguageSwitcher from './switchlanguage'
import { cn } from '@/lib/utils'
import { AnimatedGradientText } from '../ui/animated-gradient-text'
export default function Herosection() {
    const { isSignedIn } = useUser()
    const t = useTranslations("Home");
    const router = useRouter();
    const pathname = usePathname();
      const switchLanguage = (locale: string) => {
    // Remplace le premier segment de l'URL par la langue choisie
    const segments = pathname.split("/");
    segments[1] = locale;
    const newPath = segments.join("/");
    router.push(newPath);
  };
 const [open,setOpen] = useState(false)
  return (
    <>
           <nav className="border-b border-gray-800 bg-black/30 backdrop-blur-xl  sticky top-0 z-50">
  <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
    {/* Logo */}
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-white">Meetly</span>
    </div>

    {/* Menu Desktop */}
    <div className="hidden md:flex items-center gap-4">
      {isSignedIn ? (
        <>

        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/home">Dashboard</Link>
        </Button>
          <LanguageSwitcher/>
        </>

      ) : (
        <>
          <SignInButton signUpFallbackRedirectUrl={"/home"}  forceRedirectUrl={"/home"} mode="modal">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
              {t('SignIn')}
            </Button>
          </SignInButton>
          <SignUpButton forceRedirectUrl={"/home"}  mode="modal">
            <Button className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
              {t('SignUp')}
            </Button>
          </SignUpButton>
          <LanguageSwitcher/>
        </>
      )}
    </div>

    {/* Menu Mobile */}
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)}>
        <Menu className="w-6 h-6 text-white cursor-pointer" />
      </button>
    </div>
  </div>

  {/* Dropdown Mobile */}
  {open && (
    <div className="md:hidden bg-black/90 backdrop-blur-sm border-t border-gray-800 flex flex-col items-start p-4 gap-3">
      {isSignedIn ? (
        <>
        <Link href="/home" className="text-white font-semibold">Dashboard</Link>
        <LanguageSwitcher/>
        </>


      ) : (
        <>
          <SignInButton mode="modal">
            <span className="text-gray-300 hover:text-white cursor-pointer">{t('SignIn')}</span>
          </SignInButton>
          <SignUpButton mode="modal">
            <span className="text-purple-500 hover:text-purple-400 cursor-pointer">{t('SignUp')}</span>
          </SignUpButton>
          <LanguageSwitcher/>
        </>
      )}
    </div>
  )}
</nav>

             <section className="py-20 px-4 ]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="group relative mx-auto flex w-fit items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#3b82f61f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#3b82f63f] mb-8">
                        <span
                            className={cn(
                                "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#3b82f6]/50 via-[#1d4ed8]/50 to-[#3b82f6]/50 bg-[length:300%_100%] p-[1px]",
                            )}
                            style={{
                                WebkitMask:
                                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                WebkitMaskComposite: "destination-out",
                                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                maskComposite: "subtract",
                                WebkitClipPath: "padding-box",
                            }}
                        />
                        <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                        <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
                        <AnimatedGradientText className="text-sm font-medium text-gray-300">
                            AI-Powered Meeting Assistant
                        </AnimatedGradientText>
                        <ChevronRight
                            className="ml-1 w-4 h-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                        />
                    </div>
                     <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                     {t('HeroText')}{' '}
                         <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600  bg-clip-text text-transparent">{t('HeroText2')}</span> 
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto mb-8 bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
                       {t('HeroSubTitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        {isSignedIn ? (
                            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 px-8 py-4" >
                                <Link href="/home" className="group">
                                    <span>Dashboard</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />

                                </Link>
                            </Button>
                        ) : (
                            <SignUpButton mode="modal">
                                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 px-8 py-4 group cursor-pointer">
                                    <span>{t('HeroBtn1')}</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </SignUpButton>
                        )}

                        <Button variant="outline" size="lg" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 cursor-pointer">
                            <Play className="w-5 h-5 mr-2" />
                            <span>{t('HeroBtn2')}</span>
                        </Button>
                    </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{t('Check1')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{t('Check2')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{t('Check3')}n</span>
                        </div>
                    </div>
                </div>

             </section>


    </>
  )
}
