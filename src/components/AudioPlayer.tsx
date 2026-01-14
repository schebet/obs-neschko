import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  streamUrl: string;
  onAudioReady: (audio: HTMLAudioElement, context: AudioContext, source: MediaElementAudioSourceNode) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const AudioPlayer = ({ streamUrl, onAudioReady, isPlaying, setIsPlaying }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeAudio = async () => {
    if (!streamUrl) {
      setError('Unesite URL stream-a');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      sourceRef.current = null;

      const audio = new Audio();
      // Try without crossOrigin first for better compatibility
      audio.src = streamUrl;
      audio.volume = volume / 100;
      audioRef.current = audio;

      // Create audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Wait for audio to be playable
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout pri učitavanju'));
        }, 15000);

        audio.oncanplay = () => {
          clearTimeout(timeout);
          resolve();
        };

        audio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Greška pri učitavanju stream-a'));
        };

        audio.load();
      });

      // Create source node for recording
      try {
        audio.crossOrigin = 'anonymous';
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(audioContextRef.current.destination);
      } catch (sourceErr) {
        // If CORS fails, still allow playback without recording capability
        console.warn('CORS ograničenje - snimanje možda neće raditi:', sourceErr);
      }

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      
      if (sourceRef.current) {
        onAudioReady(audio, audioContextRef.current!, sourceRef.current!);
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err?.message || 'Nepoznata greška';
      setError(`Greška: ${errorMsg}. Proverite da je URL ispravan i dostupan.`);
      console.error('Audio error:', err);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !audioRef.current.src) {
      await initializeAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Re-initialize when URL changes
  useEffect(() => {
    if (streamUrl && audioRef.current?.src !== streamUrl) {
      sourceRef.current = null;
      if (isPlaying) {
        initializeAudio();
      }
    }
  }, [streamUrl]);

  return (
    <div className="space-y-4">
      {/* Stream Status */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <div className={`p-2 rounded-full ${isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
          <Radio className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {streamUrl || 'Nema URL-a'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? 'Učitavanje...' : isPlaying ? 'Reprodukuje se' : 'Zaustavljeno'}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={togglePlay}
          size="lg"
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/80"
          disabled={isLoading || !streamUrl}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>

        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {isMuted ? 0 : volume}%
          </span>
        </div>
      </div>
    </div>
  );
};
