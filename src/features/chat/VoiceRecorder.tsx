"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, onCancel, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordingDuration(recordingTime);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 5 minutes
          if (newTime >= 300) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('error', 'Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setRecordingDuration(0);
    chunksRef.current = [];
  };

  const handleSend = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, recordingDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
      {/* Recording Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Recording...
              </span>
            </div>
          )}
          {recordedBlob && !isRecording && (
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Voice message ready
              </span>
            </div>
          )}
          {!isRecording && !recordedBlob && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Ready to record
            </span>
          )}
        </div>

        <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
          {formatTime(isRecording ? recordingTime : recordingDuration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !recordedBlob && (
          <>
            <Button onClick={onCancel} variant="outline" disabled={disabled}>
              Cancel
            </Button>
            <Button
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          </>
        )}

        {isRecording && (
          <>
            <Button onClick={onCancel} variant="outline" disabled={disabled}>
              Cancel
            </Button>
            <Button
              onClick={stopRecording}
              variant="destructive"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </>
        )}

        {recordedBlob && !isRecording && (
          <>
            <Button onClick={onCancel} variant="outline" disabled={disabled}>
              Cancel
            </Button>
            <Button
              onClick={discardRecording}
              variant="outline"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Discard
            </Button>
            <Button
              onClick={handleSend}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </>
        )}
      </div>

      {/* Recording Tips */}
      {!isRecording && !recordedBlob && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-500">
          Maximum recording time: 5 minutes
        </p>
      )}
    </div>
  );
}
