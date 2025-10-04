"use client"
import React from 'react'
import { Bot, Calendar, Mail, MessageSquare, Share2, Slack } from 'lucide-react'
import { useTranslations } from 'next-intl';
import { useParams } from "next/navigation";
const features = [
  {
    icon: Bot,
    title: "AI Meeting Summaries",
    titleFr: "Résumés De Réunions Par IA",
    description: "Automatic meeting summaries and action items after each meeting",
    descriptionFr: "Générez automatiquement des résumés de réunion et des actions à suivre après chaque rencontre.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Calendar,
    title: "Smart Calendar Integration",
    titleFr: "Intégration Intelligente Du Calendrier",
    description: "Connect Google Calendar and bots automatically join meetings",
    descriptionFr: "Connectez Google Calendar et laissez les bots rejoindre automatiquement vos réunions.",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Mail,
    title: "Automated Email Reports",
    titleFr: "Rapports Par E-Mail Automatisés",
    description: "Receive beautiful email summaries with action items",
    descriptionFr: "Recevez de superbes résumés par e-mail accompagnés des actions à entreprendre.",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: MessageSquare,
    title: "Chat with Meetings",
    titleFr: "Discutez Avec Vos Réunions",
    description: "Ask questions about meetings using our RAG pipeline",
    descriptionFr: "Posez des questions sur vos réunions grâce à notre pipeline RAG intelligent.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Share2,
    title: "One-Click Integrations",
    titleFr: "Intégrations En Un Clic",
    description: "Push action items to Slack, Asana, Jira and Trello",
    descriptionFr: "Envoyez vos actions directement vers Slack, Asana, Jira ou Trello en un seul clic.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Slack,
    title: "Slack Bot Integration",
    titleFr: "Intégration Du Bot Slack",
    description: "Install our Slack Bot to ask questions and share insights",
    descriptionFr: "Installez notre bot Slack pour poser des questions et partager des informations en temps réel.",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
];

export default function FeaturesSection() {
  const t = useTranslations("Home");
  const params = useParams();
  const locale = params?.locale;
  return (
        <section className='py-20 '>
            <div className='max-w-6xl mx-auto px-4'>
                 <div className='text-center mb-16'>
                    <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                        {t('FeatureTitle')}{' '}
                        <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600  bg-clip-text text-transparent">
                            {t('FeatureTitle2')}
                        </span>
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
                        {t('FeatureDescription')}
                    </p>

                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className='bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all'
                        >
                            <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className='text-xl font-semibold text-white mb-2'>
                                {locale === "en"?feature.title:feature.titleFr}
                            </h3>
                            <p className='text-gray-400'>
                            {locale === "en"?feature.description:feature.descriptionFr}

                            </p>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    
  )
}
