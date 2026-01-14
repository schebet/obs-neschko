import { useState, useRef, useCallback } from 'react';
import type { AudioFormat } from '@/components/RecordingSettings';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: (audioContext: AudioContext, source: MediaElementAudioSourceNode) => void;
  stopRecording: (format?: AudioFormat) => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

// Convert WebM blob to MP3 using lamejs
const convertToMp3 = async (webmBlob: Blob): Promise<Blob> => {
  const lamejs = await import('lamejs');
  
  // Decode the WebM audio
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Get audio data
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;
  
  // Create MP3 encoder
  const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];
  
  // Get channel data
  const left = audioBuffer.getChannelData(0);
  const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
  
  // Convert Float32 to Int16
  const leftInt = new Int16Array(samples);
  const rightInt = new Int16Array(samples);
  
  for (let i = 0; i < samples; i++) {
    leftInt[i] = Math.max(-32768, Math.min(32767, left[i] * 32768));
    rightInt[i] = Math.max(-32768, Math.min(32767, right[i] * 32768));
  }
  
  // Encode in chunks
  const sampleBlockSize = 1152;
  for (let i = 0; i < samples; i += sampleBlockSize) {
    const leftChunk = leftInt.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt.subarray(i, i + sampleBlockSize);
    
    const mp3buf = channels > 1 
      ? mp3Encoder.encodeBuffer(leftChunk, rightChunk)
      : mp3Encoder.encodeBuffer(leftChunk);
    
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }
  
  // Flush remaining data
  const mp3buf = mp3Encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }
  
  await audioContext.close();
  
  // Convert Int8Array[] to ArrayBuffer[]
  const buffers = mp3Data.map(arr => arr.buffer as ArrayBuffer);
  return new Blob(buffers, { type: 'audio/mp3' });
};

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback((audioContext: AudioContext, source: MediaElementAudioSourceNode) => {
    chunksRef.current = [];
    setRecordingTime(0);

    // Create a destination node to capture the audio
    const destination = audioContext.createMediaStreamDestination();
    destinationRef.current = destination;
    
    // Connect the source to both the destination (for speakers) and the recorder
    source.connect(destination);

    const mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
    startTimer();
  }, [startTimer]);

  const stopRecording = useCallback(async (format: AudioFormat = 'webm'): Promise<Blob | null> => {
    stopTimer();
    setIsRecording(false);
    setRecordingTime(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Wait a bit for final data
    await new Promise(resolve => setTimeout(resolve, 100));

    if (chunksRef.current.length > 0) {
      const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];
      
      if (format === 'mp3') {
        try {
          return await convertToMp3(webmBlob);
        } catch (err) {
          console.error('MP3 conversion failed, returning WebM:', err);
          return webmBlob;
        }
      }
      
      return webmBlob;
    }

    return null;
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
    }
  }, [startTimer]);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};
