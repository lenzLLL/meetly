'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useMeetingDetail } from './hooks/useMeetingDetail'
import MeetingHeader from './components/MeetingHeader'
import MeetingInfo from './components/MeetingInfo'
import { Button } from '@/components/ui/button'
import ActionItems from './components/action-items/ActionItems'
import TranscriptDisplay from './components/TranscriptDisplay'
import ChatSidebar from './components/ChatSidebar'
import CustomAudioPlayer from './components/AudioPlayer'
import MeetingPermissionList from '../../subaccounts/components/guess_details'
import CustomModal from '../../subaccounts/components/custom_modal'
import { useModal } from '../../subaccounts/components/modal_provider'
import PermissionsModal from '../../meetings/permission.modal'

function MeetingDetail() {
  const t = useTranslations('Meetings')
   
  const {
    meetingId,
    isOwner,
    userChecked,
    chatInput,
    setChatInput,
    messages,
    showSuggestions,
    activeTab,
    setActiveTab,
    meetingData,
    loading,
    handleSendMessage,
    handleSuggestionClick,
    handleInputChange,
    deleteActionItem,
    addActionItem,
    displayActionItems,
    meetingInfoData,
  } = useMeetingDetail()

  const [recording, setRecording] = useState('')

  useEffect(() => {
    if (meetingData?.recordingUrl) {
      setRecording(meetingData.recordingUrl)
    }
  }, [meetingData])

  return (
    <div className='mt-5 sm:mt-0 min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]'>
      <MeetingHeader
        title={meetingData?.title || t('meeting')}
        meetingId={meetingId}
        summary={meetingData?.summary}
        actionItems={meetingData?.actionItems?.map(item => `• ${item.text}`).join('\n') || ''}
        isOwner={isOwner}
        isLoading={!userChecked}
      />

      <div className='flex lg:flex-row h-[calc(100vh-73px)]'>
        <div
          className={`flex-1 p-6 overflow-auto pb-24 ${
            !userChecked ? '' : !isOwner ? 'max-w-4xl mx-auto' : ''
          }`}
        >
          <MeetingInfo meetingData={meetingInfoData} />

          <div className='mb-8'>
            {/* Onglets */}
            <div className='flex border-b border-border'>
              <Button
                variant='ghost'
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none shadow-none transition-colors
                  ${
                    activeTab === 'summary'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                  }`}
                style={{ boxShadow: 'none' }}
                type='button'
              >
                {t('summary')}
              </Button>

              <Button
                variant='ghost'
                onClick={() => setActiveTab('transcript')}
                className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none shadow-none transition-colors
                  ${
                    activeTab === 'transcript'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                  }`}
                style={{ boxShadow: 'none' }}
                type='button'
              >
                {t('transcript')}
              </Button>

              <Button
                variant='ghost'
                onClick={() => setActiveTab('recording')}
                className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none shadow-none transition-colors
                  ${
                    activeTab === 'recording'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                  }`}
                style={{ boxShadow: 'none' }}
                type='button'
              >
                {t('recording')}
              </Button>

          
            </div>

            <div className='mt-6'>
              {/* Résumé */}
              {activeTab === 'summary' && (
                <div>
                  {loading ? (
                    <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                      <p className='text-muted-foreground'>{t('loadingData')}</p>
                    </div>
                  ) : meetingData?.processed ? (
                    <div className='space-y-6'>
                      {meetingData.summary && (
                        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6'>
                          <h3 className='text-lg font-semibold text-foreground mb-3'>
                            {t('meetingSummary')}
                          </h3>
                          <p className='text-muted-foreground leading-relaxed'>
                            {meetingData.summary}
                          </p>
                        </div>
                      )}

                      {isOwner && displayActionItems.length > 0 && (
                        <ActionItems
                          actionItems={displayActionItems}
                          onDeleteItem={deleteActionItem}
                          onAddItem={addActionItem}
                          meetingId={meetingId}
                        />
                      )}

                      {!isOwner && displayActionItems.length > 0 && (
                        <div className='border-b border-gray-800 bg-black/30 backdrop-blur-xl rounded-lg p-6 border'>
                          <h3 className='text-lg font-semibold text-foreground mb-4'>
                            {t('actionItems')}
                          </h3>
                          <div className='space-y-3'>
                            {displayActionItems.map((item) => (
                              <div key={item.id} className='flex items-start gap-3'>
                                <div className='w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0'></div>
                                <p className='text-sm text-foreground'>{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='border-b border-gray-800 bg-black/30 backdrop-blur-xl border rounded-lg p-6 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                      <p className='text-muted-foreground'>{t('processingAI')}</p>
                      <p className='text-sm text-muted-foreground mt-2'>{t('emailNotification')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transcription */}
              {activeTab === 'transcript' && (
                <div>
                  {loading ? (
                    <div className='border-b border-gray-800 bg-black/30 backdrop-blur-xl border rounded-lg p-6 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                      <p className='text-muted-foreground'>{t('loadingData')}</p>
                    </div>
                  ) : meetingData?.transcript ? (
                    <TranscriptDisplay transcript={meetingData.transcript} />
                  ) : (
                    <div className='border-b border-gray-800 bg-black/30 backdrop-blur-xl rounded-lg p-6 border text-center'>
                      <p className='text-muted-foreground'>{t('noTranscript')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Enregistrement */}
              {activeTab === 'recording' && (
                <div>
                  {!recording ? (
                    <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                      <p className='text-muted-foreground'>{t('loadingRecording')}</p>
                    </div>
                  ) : (
                    <div className='w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-xl border bg-black'>
                      <video src={recording} controls className='w-full h-auto' preload='metadata' />
                    </div>
                  )}
                </div>
              )}

             
            </div>
          </div>
        </div>

        {/* Chat */}
        {!userChecked ? (
          <div className='w-90 border-l border-border p-4 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]'>
            <div className='animate-pulse'>
              <div className='h-4 bg-[#1a0b2e]/70 rounded w-1/2 mb-4'></div>
              <div className='space-y-3'>
                <div className='h-8 bg-[#1a0b2e]/70 rounded'></div>
                <div className='h-8 bg-[#1a0b2e]/70 rounded'></div>
                <div className='h-8 bg-[#1a0b2e]/70 rounded'></div>
              </div>
            </div>
          </div>
        ) : (
          isOwner && (
            <ChatSidebar
              messages={messages}
              chatInput={chatInput}
              showSuggestions={showSuggestions}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onSuggestionClick={handleSuggestionClick}
            />
          )
        )}
      </div>

      <CustomAudioPlayer recordingUrl={meetingData?.recordingUrl} isOwner={isOwner} />
    </div>
  )
}

export default MeetingDetail
