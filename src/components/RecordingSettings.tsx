import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type AudioFormat = 'webm' | 'mp3';

interface RecordingSettingsProps {
  fileName: string;
  setFileName: (name: string) => void;
  audioFormat: AudioFormat;
  setAudioFormat: (format: AudioFormat) => void;
  disabled?: boolean;
}

export const RecordingSettings = ({
  fileName,
  setFileName,
  audioFormat,
  setAudioFormat,
  disabled = false,
}: RecordingSettingsProps) => {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <h3 className="font-medium text-foreground text-sm">Podešavanja snimka</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* File Name */}
        <div className="space-y-2">
          <Label htmlFor="file-name" className="text-xs text-muted-foreground">
            Ime fajla
          </Label>
          <Input
            id="file-name"
            type="text"
            placeholder="snimak"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={disabled}
            className="bg-background"
          />
        </div>

        {/* Audio Format */}
        <div className="space-y-2">
          <Label htmlFor="audio-format" className="text-xs text-muted-foreground">
            Format
          </Label>
          <Select
            value={audioFormat}
            onValueChange={(value: AudioFormat) => setAudioFormat(value)}
            disabled={disabled}
          >
            <SelectTrigger id="audio-format" className="bg-background">
              <SelectValue placeholder="Izaberite format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webm">
                <div className="flex items-center gap-2">
                  <span>WebM</span>
                  <span className="text-xs text-muted-foreground">(Opus codec)</span>
                </div>
              </SelectItem>
              <SelectItem value="mp3">
                <div className="flex items-center gap-2">
                  <span>MP3</span>
                  <span className="text-xs text-muted-foreground">(Kompatibilno)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {audioFormat === 'webm' 
          ? 'WebM pruža najbolji kvalitet za web. Podržan u modernim browserima.'
          : 'MP3 je univerzalno kompatibilan format. Konverzija se vrši u browseru.'}
      </p>
    </div>
  );
};
