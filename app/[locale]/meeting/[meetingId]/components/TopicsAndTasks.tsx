'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

interface TopicsAndTasksProps {
  actionItems?: Array<{
    id: number | string;
    text: string;
  }>;
  summary?: string;
  isOwner?: boolean;
}

export default function TopicsAndTasks({
  actionItems = [],
  summary,
  isOwner = false,
}: TopicsAndTasksProps) {
  const t = useTranslations('Meetings');
  
  // Extract key points/topics from summary (simple heuristic)
  const extractTopics = (text: string): string[] => {
    if (!text) return [];
    // Split by common separators and filter short ones
    return text
      .split(/[.!?;,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 10 && item.length < 150)
      .slice(0, 5);
  };

  const topics = summary ? extractTopics(summary) : [];

  return (
    <div className='space-y-6'>
      {/* Action Items / Tasks */}
      {actionItems.length > 0 && (
        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <CheckCircle2 size={20} className='text-primary' />
            <h3 className='text-lg font-semibold text-foreground'>{t('actionItems')}</h3>
            <span className='ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded'>
              {actionItems.length}
            </span>
          </div>
          <div className='space-y-3'>
            {actionItems.map((item) => (
              <div
                key={item.id}
                className='flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg'
              >
                <div className='w-5 h-5 rounded-full bg-primary/30 border border-primary/50 flex-shrink-0 mt-1'></div>
                <p className='text-sm text-foreground leading-relaxed'>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics / Key Points */}
      {topics.length > 0 && (
        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Lightbulb size={20} className='text-amber-500' />
            <h3 className='text-lg font-semibold text-foreground'>{t('keyTopics')}</h3>
            <span className='ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded'>
              {topics.length}
            </span>
          </div>
          <div className='space-y-2'>
            {topics.map((topic, idx) => (
              <div
                key={idx}
                className='flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg'
              >
                <span className='text-xs font-semibold text-amber-400 bg-amber-500/20 px-2 py-1 rounded flex-shrink-0 mt-0.5'>
                  {idx + 1}
                </span>
                <p className='text-sm text-foreground leading-relaxed'>{topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {actionItems.length === 0 && topics.length === 0 && (
        <div className='bg-[#1a0b2e]/70 border border-border rounded-lg p-6 text-center'>
          <AlertCircle size={32} className='mx-auto mb-3 text-muted-foreground' />
          <p className='text-muted-foreground'>
            {t('noActionItemsOrTopics')}
          </p>
        </div>
      )}
    </div>
  );
}
