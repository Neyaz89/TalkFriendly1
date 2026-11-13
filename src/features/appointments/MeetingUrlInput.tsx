"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  validateMeetingUrl, 
  PROVIDER_INFO, 
  getMeetingInstructions,
  type MeetingProvider 
} from "@/lib/meeting-url-utils";
import { LinkIcon, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface MeetingUrlInputProps {
  appointmentId: string;
  currentUrl?: string;
  onUrlSet?: (url: string, provider: MeetingProvider) => void;
}

export function MeetingUrlInput({ 
  appointmentId, 
  currentUrl, 
  onUrlSet 
}: MeetingUrlInputProps) {
  const [url, setUrl] = useState(currentUrl || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<MeetingProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setValidationError(null);
    
    if (value.trim()) {
      const validation = validateMeetingUrl(value);
      if (validation.isValid && validation.provider) {
        setDetectedProvider(validation.provider);
      } else {
        setDetectedProvider(null);
        if (validation.error) {
          setValidationError(validation.error);
        }
      }
    } else {
      setDetectedProvider(null);
    }
  };

  const handleSave = async () => {
    const validation = validateMeetingUrl(url);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid URL');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/appointments/set-meeting-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointmentId,
          meeting_url: url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save meeting URL');
      }

      success('Meeting link saved successfully');
      onUrlSet?.(validation.sanitizedUrl!, validation.provider!);
    } catch (error: any) {
      console.error('Error saving meeting URL:', error);
      showError(error.message || 'Failed to save meeting link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-lg">Meeting Link</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Provide a link to your preferred video meeting platform (Google Meet, Zoom, Teams, etc.)
        </p>

        {/* URL Input */}
        <div>
          <Label htmlFor="meeting-url">Meeting URL</Label>
          <Input
            id="meeting-url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="mt-1"
          />
          
          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}

          {/* Detected Provider */}
          {detectedProvider && !validationError && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Detected: {PROVIDER_INFO[detectedProvider].icon} {PROVIDER_INFO[detectedProvider].name}
            </div>
          )}
        </div>

        {/* Provider Instructions */}
        {detectedProvider && !validationError && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            💡 {getMeetingInstructions(detectedProvider)}
          </div>
        )}

        {/* Common Examples */}
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            View examples of supported platforms
          </summary>
          <div className="mt-2 space-y-1 text-gray-600 dark:text-gray-400 ml-4">
            <div>• Google Meet: https://meet.google.com/xxx-xxxx-xxx</div>
            <div>• Zoom: https://zoom.us/j/1234567890</div>
            <div>• Microsoft Teams: https://teams.microsoft.com/l/meetup-join/...</div>
            <div>• Jitsi: https://meet.jit.si/YourRoomName</div>
            <div>• Any other video platform URL</div>
          </div>
        </details>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving || !url.trim() || !!validationError}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Meeting Link
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
