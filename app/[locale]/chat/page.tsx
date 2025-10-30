'use client'

import React from 'react'
import useChatAll from './hooks/useChatAll'
import ChatSuggestions from './components/ChatSuggestions'
import ChatMessages from './components/ChatMessages'
import ChatInput from './components/ChatInput'
import AppHeader from '@/components/Header'

function Chat() {
    const {
        chatInput,
        setChatInput,
        messages,
        showSuggestions,
        isLoading,
        chatSuggestions,
        handleSendMessage,
        handleSuggestionClick,
        handleInputChange
    } = useChatAll()


    return (
        <div className='h-screen mt-5 sm:mt-0 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] flex flex-col'>
            <AppHeader/>     {/* === Metrics Section === */}
            
            <div className='flex-1 flex flex-col max-w-4xl mx-auto w-full'>

                <div className='flex-1 p-6 overflow-auto'>
                    {messages.length === 0 && showSuggestions ? (
                        <ChatSuggestions
                            suggestions={chatSuggestions}
                            onSuggestionClick={handleSuggestionClick}
                        />
                    ) : (
                        <ChatMessages
                            messages={messages}
                            isLoading={isLoading}
                        />
                    )}

                </div>
                <ChatInput
                    chatInput={chatInput}
                    onInputChange={handleInputChange}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                />

            </div>

        </div>
    )
}

export default Chat
