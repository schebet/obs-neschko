import { useState, useRef, useCallback } from 'react';
import { Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AudioPlayer } from './AudioPlayer';
import { RecordingControls } from './RecordingControls';
import { TimerSettings } from './TimerSettings';
import { RecordingSettings, type AudioFormat } from './RecordingSettings';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRecordingTimer } from '@/hooks/useRecordingTimer';
import { toast } from 'sonner';

export const StreamRecorder = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastRecording, setLastRecording] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('snimak');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('webm');
  const [isConverting, setIsConverting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder();

  const handleStopAndDownload = useCallback(async () => {
    setIsConverting(true);
    
    if (audioFormat === 'mp3') {
      toast.info('Konverzija u MP3 format...');
    }
    
    const blob = await stopRecording(audioFormat);
    
    if (blob) {
      setLastRecording(blob);
      // Auto download
      const url = URL.createObjectURL(blob);
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
      toast.success(`Snimak sačuvan kao ${extension.toUpperCase()}`);
    }
    
    setIsConverting(false);
    resetCountdown();
  }, [stopRecording, fileName, audioFormat]);

  const {
    timerEnabled,
    timerDuration,
    remainingTime,
    setTimerEnabled,
    setTimerDuration,
    startCountdown,
    stopCountdown,
    resetCountdown,
  } = useRecordingTimer(handleStopAndDownload);

  const handleAudioReady = (audio: HTMLAudioElement, context: AudioContext, source: MediaElementAudioSourceNode) => {
    audioContextRef.current = context;
    sourceRef.current = source;
  };

  const handleStartRecording = () => {
    if (audioContextRef.current && sourceRef.current) {
      startRecording(audioContextRef.current, sourceRef.current);
      if (timerEnabled) {
        startCountdown();
      }
    }
  };

  const handleStopRecording = async () => {
    setIsConverting(true);
    
    if (audioFormat === 'mp3') {
      toast.info('Konverzija u MP3 format...');
    }
    
    const blob = await stopRecording(audioFormat);
    
    if (blob) {
      setLastRecording(blob);
      toast.success('Snimak spreman za preuzimanje');
    }
    
    setIsConverting(false);
    stopCountdown();
    resetCountdown();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Radio className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stream Recorder</h1>
            <p className="text-sm text-muted-foreground">Snimajte audio stream-ove direktno u browseru</p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="stream-url" className="text-foreground">URL Audio Stream-a</Label>
          <Input
            id="stream-url"
            type="url"
            placeholder="https://stream.example.com/radio.mp3"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <p className="text-xs text-muted-foreground">
            Podržani formati: MP3, AAC, OGG stream-ovi, direktni linkovi ka audio fajlovima
          </p>
        </div>

        {/* Audio Player */}
        <AudioPlayer
          streamUrl={streamUrl}
          onAudioReady={handleAudioReady}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />

        {/* Recording Settings */}
        <RecordingSettings
          fileName={fileName}
          setFileName={setFileName}
          audioFormat={audioFormat}
          setAudioFormat={setAudioFormat}
          disabled={isRecording || isConverting}
        />

        {/* Timer Settings */}
        <TimerSettings
          timerEnabled={timerEnabled}
          setTimerEnabled={setTimerEnabled}
          timerDuration={timerDuration}
          setTimerDuration={setTimerDuration}
          remainingTime={remainingTime}
          isRecording={isRecording}
        />

        {/* Recording Controls */}
        <RecordingControls
          isRecording={isRecording}
          recordingTime={recordingTime}
          canRecord={isPlaying && !isConverting}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          lastRecording={lastRecording}
          fileName={fileName}
          audioFormat={audioFormat}
          isConverting={isConverting}
        />

        {/* Info */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2">Kako koristiti</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Unesite URL audio stream-a (radio stanica, MP3 link...)</li>
            <li>Pritisnite Play za reprodukciju</li>
            <li>Podesite ime fajla i format snimka</li>
            <li>Opciono: Uključite tajmer za automatsko zaustavljanje</li>
            <li>Pritisnite "Započni snimanje" za početak</li>
            <li>Snimak će se automatski preuzeti kada zaustavite snimanje</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
