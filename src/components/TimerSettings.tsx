import { Clock, Timer } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimerSettingsProps {
  timerEnabled: boolean;
  setTimerEnabled: (enabled: boolean) => void;
  timerDuration: number;
  setTimerDuration: (duration: number) => void;
  remainingTime: number;
  isRecording: boolean;
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

const PRESET_DURATIONS = [
  { label: '5 minuta', value: 5 * 60 },
  { label: '15 minuta', value: 15 * 60 },
  { label: '30 minuta', value: 30 * 60 },
  { label: '1 sat', value: 60 * 60 },
  { label: '2 sata', value: 2 * 60 * 60 },
  { label: 'Prilagođeno', value: -1 },
];

export const TimerSettings = ({
  timerEnabled,
  setTimerEnabled,
  timerDuration,
  setTimerDuration,
  remainingTime,
  isRecording,
}: TimerSettingsProps) => {
  const isCustom = !PRESET_DURATIONS.slice(0, -1).some(d => d.value === timerDuration);
  const customMinutes = Math.floor(timerDuration / 60);

  const handlePresetChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue > 0) {
      setTimerDuration(numValue);
    }
  };

  const handleCustomMinutes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value) || 0;
    setTimerDuration(Math.max(1, mins) * 60);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-muted-foreground" />
          <Label htmlFor="timer-switch" className="font-medium text-foreground">
            Automatski tajmer
          </Label>
        </div>
        <Switch
          id="timer-switch"
          checked={timerEnabled}
          onCheckedChange={setTimerEnabled}
          disabled={isRecording}
        />
      </div>

      {timerEnabled && (
        <>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Trajanje snimanja</Label>
            <Select
              value={isCustom ? '-1' : timerDuration.toString()}
              onValueChange={handlePresetChange}
              disabled={isRecording}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_DURATIONS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={customMinutes}
                onChange={handleCustomMinutes}
                disabled={isRecording}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minuta</span>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-200">Preostalo vreme</span>
              </div>
              <span className="font-mono text-lg text-amber-400">
                {formatTime(remainingTime)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
