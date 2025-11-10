'use client'

import React from 'react'
import { useIntegrations } from './hooks/useIntegrations'
import SetupForm from './components/SetupForm'
import IntegrationCard from './components/IntegrationCard'
import AppHeader from '@/components/Header'
import { useTranslations } from 'next-intl'

export default function Integrations() {
    const t = useTranslations('Integrations')

    const {
        integrations,
        loading,
        setupMode,
        setSetupMode,
        setupData,
        setSetupData,
        setupLoading,
        fetchSetupData,
        handleConnect,
        handleDisconnect,
        handleSetupSubmit
    } = useIntegrations()

    const howItWorks = [
        t('HowItWorks1'),
        t('HowItWorks2'),
        t('HowItWorks3'),
        t('HowItWorks4')
    ]

    if (loading) {
        return (
            <div className='bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] min-h-screen flex items-center justify-center p-6'>
                <div className='flex flex-col items-center justify-center'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mb-4'></div>
                    <div className='text-foreground'>{t('LoadingIntegrations')}</div>
                </div>
            </div>
        )
    }

    return (
        <>
            <AppHeader />

            <div className='mt-5 sm:mt-0 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] min-h-screen p-6'>
                <div className='max-w-4xl mx-auto'>
                    {/* Page Title */}
                    <div className='mb-8'>
                        <h1 className='text-2xl font-bold text-foreground mb-2'>{t('IntegrationsTitle')}</h1>
                        <p className='text-muted-foreground'>{t('IntegrationsDescription')}</p>
                    </div>

                    {/* Setup Modal */}
                    {setupMode && (
                        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                            <div className='bg-[#1a0b2e]/70 rounded-lg p-6 border border-border max-w-md w-full mx-4'>
                                <h2 className='text-lg font-semibold text-foreground mb-4'>
                                    {t('SetupTitle', { platform: setupMode })}
                                </h2>

                                <SetupForm
                                    platform={setupMode}
                                    data={setupData}
                                    onSubmit={handleSetupSubmit}
                                    onCancel={() => {
                                        setSetupMode(null)
                                        setSetupData(null)
                                        window.history.replaceState({}, '', '/integrations')
                                    }}
                                    loading={setupLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Integrations Grid */}
                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {integrations.map((integration) => (
                            <IntegrationCard
                                key={integration.platform}
                                integration={integration}
                                onConnect={handleConnect}
                                onDisconnect={handleDisconnect}
                                onSetup={(platform) => {
                                    setSetupMode(platform)
                                    fetchSetupData(platform)
                                }}
                            />
                        ))}
                    </div>

                    {/* How It Works Section */}
                    <div className='mt-8 bg-[#1a0b2e]/70 rounded-lg p-6 border border-border'>
                        <h3 className='font-semibold text-foreground mb-4'>{t('HowItWorksTitle')}</h3>

                        <table className='min-w-full border border-border text-sm text-left text-foreground'>
                            <thead>
                                <tr className='bg-[#1a0b2e]/80'>
                                    <th className='px-4 py-2 border-b border-border'>{t('Step')}</th>
                                    <th className='px-4 py-2 border-b border-border'>{t('Description')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {howItWorks.map((step, idx) => (
                                    <tr key={idx} className='hover:bg-[#1a0b2e]/60 transition-colors'>
                                        <td className='px-4 py-2 border-b border-border font-semibold'>{idx + 1}</td>
                                        <td className='px-4 py-2 border-b border-border'>{step}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}
