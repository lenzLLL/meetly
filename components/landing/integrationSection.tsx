import React from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl';

const integrations = [
    { name: "Slack", image: "slack.png" },
    { name: "Asana", image: "asana.png" },
    { name: "Jira", image: "jira.png" },
    { name: "Trello", image: "trello.png" },
    { name: "Google Calendar", image: "gcal.png" },
    { name: "Zoom", image: "zoom.png" },
    { name: "Outlook", image: "outlook.png" }
]
export default function IntegrationSection() {
  const t = useTranslations("Home");
  return (
      <section className='py-20'>
           <div className='max-w-6xl mx-auto px-4'>
                               <div className='text-center mb-16'>
                    <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                        {t('integrationTitle')}{' '}
                        <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600  bg-clip-text text-transparent">
                            {t('integrationTitle2')}
                        </span>
                    </h2>
                    <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
                       {t('integrationDescription')}
                    </p>
                </div> 
           </div>
                           <div className='flex flex-wrap justify-center items-center gap-8 md:gap-12'>
                    {integrations.map((integration, index) => (
                        <div
                            key={index}
                            className='text-center group cursor-pointer'
                        >
                            <div className='w-16 h-16 mx-auto mb-4 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-gray-800/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10 group-hover:border-gray-700'>
                                <Image
                                    src={`/${integration.image}`}
                                    alt={`${integration.name} logo`}
                                    width={64}
                                    height={64}
                                    className='w-full h-full object-contain'
                                />
                            </div>
                            <p className='text-sm font-medium text-white'>{integration.name}</p>
                        </div>
                    ))}
                </div>
      </section>
  )
}
