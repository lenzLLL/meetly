'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square } from 'lucide-react'

export default function FloatingRecordButton() {
  const [isRecording, setIsRecording] = useState(false)
  const router = useRouter()

  const handleToggleRecording = () => {
    router.push('/recording')
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.4), 
                        0 0 40px rgba(139, 92, 246, 0.2);
          }
          50% { 
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6), 
                        0 0 60px rgba(139, 92, 246, 0.3);
          }
        }
        
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(139, 92, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
          }
        }
        
        @keyframes recording-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7),
                        0 0 30px rgba(139, 92, 246, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 15px rgba(220, 38, 38, 0),
                        0 0 50px rgba(139, 92, 246, 0.6);
          }
        }
        
        .floating-btn {
          animation: float 3s ease-in-out infinite;
        }
        
        .floating-btn:hover {
          animation: float 3s ease-in-out infinite, glow 2s ease-in-out infinite;
        }
        
        .floating-btn.recording {
          animation: recording-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleToggleRecording}
          className={`floating-btn rounded-full w-16 h-16 flex items-center justify-center font-semibold transition-all duration-500 relative overflow-hidden group cursor-pointer ${
            isRecording
              ? 'recording bg-gradient-to-br from-red-600 to-red-700'
              : 'bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600'
          }`}
        >
          {/* Gradient overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Icon container */}
          <div className="relative z-10 flex items-center justify-center">
            {isRecording ? (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                <Square className="h-7 w-7 text-white relative z-10" fill="white" />
              </>
            ) : (
              <Mic className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
            )}
          </div>

          {/* Background animation ring for recording */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-2 border-red-400 opacity-50" style={{ animation: 'pulse-ring 2s ease-out infinite' }}></div>
          )}
        </button>
      </div>
    </>
  )
}
