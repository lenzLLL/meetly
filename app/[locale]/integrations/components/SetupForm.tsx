import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

interface SetupFormProps {
    platform: string
    data: any
    onSubmit: (platform: string, config: any) => void
    onCancel: () => void
    loading: boolean
}

function SetupForm({ platform, data, onSubmit, onCancel, loading }: SetupFormProps) {
    const t = useTranslations('Integrations')

    const [selectedId, setSelectedId] = useState('')
    const [selectedName, setSelectedName] = useState('')
    const [createNew, setCreateNew] = useState(false)
    const [newName, setNewName] = useState('')

    const items = platform === 'trello' ? data?.boards :
        platform === 'slack' ? data?.channels :
            data?.projects

    const itemLabel = platform === 'trello' ? t('Board') :
        platform === 'slack' ? t('Channel') :
            t('Project')

    const handleSubmit = () => {
        if (createNew) {
            onSubmit(platform, {
                createNew: true,
                [`${itemLabel}Name`]: newName,
                workspaceId: data?.workspaceId
            })
        } else {
            onSubmit(platform, {
                [`${itemLabel}Id`]: selectedId,
                [`${itemLabel}Name`]: selectedName,
                projectKey: selectedId,
                workspaceId: data?.workspaceId
            })
        }
    }

    return (
        <div>
            <div className='mb-4'>
                <Label className='block text-sm font-medium text-foreground mb-2'>
                    {t('SelectForActionItems', { item: itemLabel })}
                </Label>

                {!createNew ? (
                    <Select
                        value={selectedId}
                        onValueChange={(value) => {
                            const selected = items?.find((item: any) =>
                                item.id === value || item.key === value || item.gid === value
                            )
                            setSelectedId(value)
                            setSelectedName(selected?.name || '')
                        }}
                    >
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder={t('ChooseExisting', { item: itemLabel })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{itemLabel}</SelectLabel>
                                {items?.map((item: any) => (
                                    <SelectItem
                                        key={item.id || item.key || item.gid}
                                        value={item.id || item.key || item.gid}
                                    >
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        type='text'
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={t('EnterNewName', { item: itemLabel })}
                    />
                )}
            </div>

            <div className='mb-6'>
                <div className='flex items-center gap-2 text-sm'>
                    <Checkbox
                        id='create-new'
                        checked={createNew}
                        onCheckedChange={(checked) => setCreateNew(!!checked)}
                    />
                    <Label htmlFor='create-new'>{t('CreateNew', { item: itemLabel })}</Label>
                </div>
            </div>

            <div className='flex gap-3'>
                <Button variant="outline" onClick={onCancel} className='flex-1 cursor-pointer'>
                    {t('Cancel')}
                </Button>

                <Button
                    onClick={handleSubmit}
                    disabled={loading || (!createNew && !selectedId) || (createNew && !newName)}
                    className='flex-1 cursor-pointer'
                >
                    {loading ? t('Saving') : t('Save')}
                </Button>
            </div>
        </div>
    )
}

export default SetupForm
