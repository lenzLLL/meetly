import React from 'react'
import { Integration } from '../hooks/useIntegrations'
import Image from 'next/image'
import { Check, ExternalLink, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface IntegrationCardProps {
    integration: Integration
    onConnect: (platform: string) => void
    onDisconnect: (platform: string) => void
    onSetup: (platform: string) => void
}

function IntegrationCard({ integration, onConnect, onDisconnect, onSetup }: IntegrationCardProps) {
    const t = useTranslations('Integrations')

    return (
        <div className='bg-[#1a0b2e]/70 rounded-lg p-6 border border-border'>
            <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 relative flex-shrink-0'>
                        <Image
                            src={integration.logo}
                            alt={`${integration.name} logo`}
                            fill
                            className='object-contain rounded'
                        />
                    </div>
                    <div>
                        <h3 className='font-semibold text-foreground'>{integration.name}</h3>
                        {integration.connected && (
                            <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full'>
                                {t('Connected')}
                            </span>
                        )}
                    </div>
                </div>
                {integration.connected && <Check className='h-5 w-5 text-green-500' />}
            </div>

            <p className='text-sm text-muted-foreground mb-4'>
                {integration.description}
            </p>

            {/* Destination / Status */}
            {integration.connected && integration.platform !== 'google-calendar' && (integration.boardName || integration.projectName || integration.channelName) && (
                <div className='mb-4 p-3 bg-green-500/10 rounded-lg'>
                    <div className='text-xs text-muted-foreground mb-1'>{t('Destination')}</div>
                    <div className='text-sm font-medium text-foreground'>
                        {integration.platform === 'slack' && integration.channelName && `#${integration.channelName}`}
                        {integration.platform === 'trello' && integration.boardName}
                        {integration.platform === 'jira' && integration.projectName}
                        {integration.platform === 'asana' && integration.projectName}
                    </div>
                </div>
            )}

            {(integration.connected && integration.platform === 'google-calendar' ||integration.connected && integration.platform === 'zoom') && (
                <div className='mb-4 p-3 bg-green-500/10 rounded-lg'>
                    <div className='text-xs text-muted-foreground mb-1'>{t('Status')}</div>
                    <div className='text-sm font-medium text-foreground'>
                        {t('AutoSyncEnabled')}
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className='flex gap-2'>
                {integration.connected ? (
                    (integration.platform === 'google-calendar'||integration.platform === 'zoom') ? (
                        <Button
                            variant="outline"
                            onClick={() => onDisconnect(integration.platform)}
                            className='flex-1 cursor-pointer'
                            type='button'
                        >
                            {t('Disconnect')}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onDisconnect(integration.platform)}
                                className='flex-1 cursor-pointer'
                                type='button'
                            >
                                {t('Disconnect')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onSetup(integration.platform)}
                                className='px-3 py-2 cursor-pointer'
                                type='button'
                            >
                                <Settings className='h-4 w-4' />
                            </Button>
                        </>
                    )
                ) : (
                    <Button
                        onClick={() => onConnect(integration.platform)}
                        className='flex-1 flex items-center justify-center gap-2 cursor-pointer'
                        type='button'
                    >
                        {t('Connect')}
                        <ExternalLink className='h-4 w-4' />
                    </Button>
                )}
            </div>
        </div>
    )
}

export default IntegrationCard
