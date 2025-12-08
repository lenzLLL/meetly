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
        <div className='min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white flex flex-col'>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .chat-container {
                    animation: fade-in 0.6s ease-out;
                }
                .message {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
            <AppHeader/>
            
            <div className='chat-container flex-1 flex flex-col w-full px-4 py-6'>
                <div className='flex-1 overflow-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-900/10 to-purple-900/10 border border-violet-500/20 p-6'>
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
