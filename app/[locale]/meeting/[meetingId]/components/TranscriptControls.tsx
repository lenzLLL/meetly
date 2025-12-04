'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, File } from 'lucide-react';
import { exportTranscriptToTxt, exportTranscriptToPdf, generateTemporaryTranscript } from '@/lib/transcript-export';
import { useToast } from '@/components/ui/use_toast';
import { useTranslations } from 'next-intl';

interface TranscriptControlsProps {
  transcript: any;
  meetingTitle: string;
  meetingDate?: string;
  speakers?: string[];
  summary?: string;
  actionItems?: any[];
  currentLanguage: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it';
  onLanguageChange: (lang: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it') => void;
  isProcessing?: boolean;
}

export default function TranscriptControls({
  transcript,
  meetingTitle,
  meetingDate,
  speakers,
  summary,
  actionItems,
  currentLanguage,
  onLanguageChange,
  isProcessing = false,
}: TranscriptControlsProps) {
  const t = useTranslations('Meetings');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportTxt = async () => {
    setIsExporting(true);
    try {
      // Use real transcript if available, otherwise generate temporary one
      const transcriptToExport = transcript && (
        (Array.isArray(transcript) && transcript.length > 0) || 
        typeof transcript === 'string'
      )
        ? transcript
        : generateTemporaryTranscript(speakers, currentLanguage);
      
      exportTranscriptToTxt(transcriptToExport, meetingTitle, {
        date: meetingDate,
        speakers,
      }, currentLanguage);
      toast({
        title: 'Success',
        description: t('transcriptDownloadedTxt'),
      });
    } catch (error) {
      console.error('Error exporting TXT:', error);
      toast({
        title: 'Error',
        description: t('failedToExportTranscript'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Use real transcript if available, otherwise generate temporary one
      const transcriptToExport = transcript && (
        (Array.isArray(transcript) && transcript.length > 0) || 
        typeof transcript === 'string'
      )
        ? transcript
        : generateTemporaryTranscript(speakers, currentLanguage);
      
      await exportTranscriptToPdf(transcriptToExport, meetingTitle, {
        date: meetingDate,
        summary,
        actionItems,
        speakers,
      }, currentLanguage);
      toast({
        title: 'Success',
        description: t('transcriptDownloadedPdf'),
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: `${t('failedToExportPdf')} - ${errorMsg}`,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-4 mb-6 p-4 bg-[#1a0b2e]/70 border border-border rounded-lg'>
      {/* Language Selector */}
      <div className='flex items-center gap-3'>
        <label className='text-sm font-medium text-foreground'>{t('language')}:</label>
        <Select value={currentLanguage} onValueChange={(val: any) => onLanguageChange(val)}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='en'>{t('english')}</SelectItem>
            <SelectItem value='fr'>{t('french')}</SelectItem>
            <SelectItem value='es'>{t('spanish') || 'Español'}</SelectItem>
            <SelectItem value='de'>{t('german') || 'Deutsch'}</SelectItem>
            <SelectItem value='pt'>{t('portuguese') || 'Português'}</SelectItem>
            <SelectItem value='it'>{t('italian') || 'Italiano'}</SelectItem>
          </SelectContent>
        </Select>
        {isProcessing && (
          <span className='text-xs text-muted-foreground animate-pulse ml-2'>
            {t('reanalyzing')}
          </span>
        )}
      </div>

      {/* Export Buttons */}
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleExportTxt}
          disabled={!transcript || isExporting || isProcessing}
          className='flex gap-2'
        >
          <FileText size={16} />
          {t('downloadTXT')}
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={handleExportPdf}
          disabled={!transcript || isExporting || isProcessing}
          className='flex gap-2'
        >
          <File size={16} />
          {t('downloadPDF')}
        </Button>
      </div>

      {/* Info */}
      {transcript && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground ml-auto'>
          <Download size={14} />
          <span>{t('downloadTranscript')}</span>
        </div>
      )}
    </div>
  );
}
