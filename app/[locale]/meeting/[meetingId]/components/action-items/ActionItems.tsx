'use client'

import React from 'react'
import { ActionItem, useActionItems } from '../../hooks/useActionItems'
import { Button } from '@/components/ui/button'
import ActionItemsList from './ActionItemsList'
import AddActionItemInput from './AddActionItemInput'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export interface ActionItemsProps {
    actionItems: ActionItem[]
    onDeleteItem: (id: number) => void
    onAddItem: (text: string) => void
    meetingId: string
}

function ActionItems({
    actionItems,
    onDeleteItem,
    onAddItem,
    meetingId
}: ActionItemsProps) {
    const t = useTranslations('Meetings')
    const {
        integrations,
        integrationsLoaded,
        loading,
        setLoading,
        showAddInput,
        setShowAddInput,
        newItemText,
        setNewItemText
    } = useActionItems(meetingId)

    const addToIntegration = async (platform: string, actionItem: ActionItem) => {
        setLoading(prev => ({ ...prev, [`${platform}-${actionItem.id}`]: true }))
        try {
            const res = await fetch('/api/integrations/action-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, actionItem: actionItem.text, meetingId })
            })

            const result = await res.json().catch(() => ({}))

            if (!res.ok) {
                console.error('integration error', platform, result)
                toast(t('failedAddToPlatform', { platform }), {
                    action: {
                        label: t('ok'),
                        onClick: () => { },
                    },
                })
                return
            }

            // Log success and show a clear success toast
            console.log('integration success', platform, result)
            toast(t('addedToPlatform', { platform }), {
                action: {
                    label: t('ok'),
                    onClick: () => { },
                },
            })
        } catch (err) {
            console.error('integration request failed', platform, err)
            toast(t('failedAddToPlatform', { platform }), {
                action: { label: t('ok'), onClick: () => {} }
            })
        } finally {
            setLoading(prev => ({ ...prev, [`${platform}-${actionItem.id}`]: false }))
        }
    }

    const handleAddNewItem = async () => {
        if (!newItemText.trim()) return
        try {
            toast(t('actionItemAdded'), { action: { label: t('ok'), onClick: () => {} } })
            const response = await fetch(`/api/meetings/${meetingId}/action-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newItemText })
            })
            if (response.ok) {
                onAddItem(newItemText)
                setNewItemText('')
                setShowAddInput(false)
            }
        } catch (error) {
            console.error('failed to add action item:', error)
        }
    }

    const handleDeleteItem = async (id: number) => {
        try {
            toast(t('actionItemDeleted'), { action: { label: t('ok'), onClick: () => {} } })
            const response = await fetch(`/api/meetings/${meetingId}/action-items/${id}`, { method: 'DELETE' })
            if (response.ok) onDeleteItem(id)
        } catch (error) {
            console.error('failed to delete action item:', error)
        }
    }

    const hasConnectedIntegrations = integrations.length > 0

    if (!integrationsLoaded) {
        return (
            <div className='bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]/70 rounded-xl p-6 border border-purple-500/20 mb-8 shadow-lg'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='p-2 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-lg animate-pulse'>
                        <span className='text-lg'>✅</span>
                    </div>
                    <h3 className='text-xl font-bold text-foreground'>
                        {t('actionItems')}
                    </h3>
                </div>
                <div className='space-y-3'>
                    {actionItems.map(item => (
                        <div key={item.id} className='group relative'>
                            <div className='flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg'>
                                <div className='w-5 h-5 rounded-full bg-purple-500/30 flex-shrink-0 animate-pulse'></div>
                                <p className='flex-1 text-sm leading-relaxed text-foreground'>
                                    {item.text}
                                </p>
                                <div className='animate-pulse'>
                                    <div className='h-6 w-20 bg-muted rounded'></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className='animate-pulse'><div className='h-10 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg'></div></div>
                </div>
            </div>
        )
    }

    return (
        <div className='bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]/70 rounded-xl p-6 border border-purple-500/20 mb-8 shadow-lg'>
            <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-lg'>
                    <span className='text-lg'>✅</span>
                </div>
                <h3 className='text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent'>
                    {t('actionItems')}
                </h3>
                <span className='ml-auto text-xs bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full font-medium border border-purple-500/50'>
                    {actionItems.length} {actionItems.length === 1 ? t('item') : t('items')}
                </span>
            </div>

            <ActionItemsList
                actionItems={actionItems}
                integrations={integrations}
                loading={loading}
                addToIntegration={addToIntegration}
                handleDeleteItem={handleDeleteItem}
            />

            <AddActionItemInput
                showAddInput={showAddInput}
                setShowAddInput={setShowAddInput}
                newItemText={newItemText}
                setNewItemText={setNewItemText}
                onAddItem={handleAddNewItem}
            />

            {!hasConnectedIntegrations && actionItems.length > 0 && (
                <div className='mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-dashed border-amber-500/30 hover:border-amber-500/50 transition-colors'>
                    <p className='text-xs text-amber-200/80 text-center'>
                        <Link href="/integrations" className='font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors'>
                            {t('connectIntegrations')}
                        </Link> {t('toAddActionItems')}
                    </p>
                </div>
            )}
        </div>
    )
}

export default ActionItems
