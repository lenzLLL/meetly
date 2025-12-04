'use client';

import React from 'react';
import { extractSpeakers } from '@/lib/transcript-export';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TranscriptInfoProps {
  transcript: any;
  meetingTitle: string;
  meetingDate?: string;
}

export default function TranscriptInfo({
  transcript,
  meetingTitle,
  meetingDate,
}: TranscriptInfoProps) {
  const t = useTranslations('Meetings');
  const speakers = extractSpeakers(transcript);

  return (
    <div className='space-y-4 mb-6'>
      {/* Meeting Info */}
      <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-4'>
        <h3 className='text-sm font-semibold text-foreground mb-2'>{t('meetingDetails')}</h3>
        <div className='space-y-2 text-sm text-muted-foreground'>
          <div>
            <span className='font-medium text-foreground'>{t('title')}:</span> {meetingTitle}
          </div>
          {meetingDate && (
            <div>
              <span className='font-medium text-foreground'>{t('date')}:</span> {meetingDate}
            </div>
          )}
        </div>
      </div>

      {/* Speakers */}
      {speakers.length > 0 && (
        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Users size={16} className='text-primary' />
            <h3 className='text-sm font-semibold text-foreground'>{t('speakers')}</h3>
            <span className='ml-auto text-xs text-muted-foreground bg-primary/20 px-2 py-1 rounded'>
              {speakers.length}
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {speakers.map((speaker) => (
              <div
                key={speaker}
                className='bg-primary/10 border border-primary/30 text-primary text-xs font-medium px-3 py-1 rounded-full'
              >
                {speaker}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-4'>
          <div className='text-xs text-muted-foreground font-medium mb-1'>{t('totalSegments')}</div>
          <div className='text-2xl font-bold text-primary'>
            {Array.isArray(transcript) ? transcript.length : 1}
          </div>
        </div>
        {speakers.length > 0 && (
          <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-4'>
            <div className='text-xs text-muted-foreground font-medium mb-1'>{t('uniqueSpeakers')}</div>
            <div className='text-2xl font-bold text-primary'>{speakers.length}</div>
          </div>
        )}
      </div>
    </div>
  );
}
