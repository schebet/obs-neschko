import { Circle, Square, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AudioFormat } from './RecordingSettings';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  canRecord: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  lastRecording: Blob | null;
  fileName?: string;
  audioFormat?: AudioFormat;
  isConverting?: boolean;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const RecordingControls = ({
  isRecording,
  recordingTime,
  canRecord,
  onStartRecording,
  onStopRecording,
  lastRecording,
  fileName = 'snimak',
  audioFormat = 'webm',
  isConverting = false,
}: RecordingControlsProps) => {
  const downloadRecording = () => {
    if (!lastRecording) return;
    
    const url = URL.createObjectURL(lastRecording);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sanitizedFileName = fileName.trim() || 'snimak';
    const extension = audioFormat === 'mp3' ? 'mp3' : 'webm';
    a.href = url;
    a.download = `${sanitizedFileName}_${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Recording Status */}
      <div className={`flex items-center justify-between p-4 rounded-lg border ${
        isRecording 
          ? 'bg-red-500/10 border-red-500/30' 
          : isConverting
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-muted/50 border-border'
      }`}>
        <div className="flex items-center gap-3">
          {isConverting ? (
            <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
          ) : (
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
          )}
          <span className="font-medium text-foreground">
            {isConverting 
              ? 'Konverzija u toku...' 
              : isRecording 
              ? 'Snimanje u toku' 
              : 'Spremno za snimanje'}
          </span>
        </div>
        <div className="font-mono text-xl text-foreground">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* Recording Buttons */}
      <div className="flex gap-3">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            disabled={!canRecord || isConverting}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
          >
            <Circle className="w-5 h-5 mr-2 fill-current" />
            Započni snimanje
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            disabled={isConverting}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
          >
            <Square className="w-5 h-5 mr-2 fill-current" />
            Zaustavi snimanje
          </Button>
        )}

        {lastRecording && !isRecording && !isConverting && (
          <Button
            onClick={downloadRecording}
            variant="outline"
            className="h-12 px-6"
          >
            <Download className="w-5 h-5 mr-2" />
            Preuzmi
          </Button>
        )}
      </div>
    </div>
  );
};
