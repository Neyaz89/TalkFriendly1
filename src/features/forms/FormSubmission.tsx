"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SupportFormMessagePayload, FormFieldResponse } from "@/types/support-form.types";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface FormSubmissionProps {
  formPayload: SupportFormMessagePayload;
  messageId: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function FormSubmission({
  formPayload,
  messageId,
  onSubmitSuccess,
  onCancel,
}: FormSubmissionProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const updateResponse = (fieldId: string, value: any) => {
    setResponses({ ...responses, [fieldId]: value });
  };

  const validateAndSubmit = async () => {
    // Validate required fields
    for (const field of formPayload.fields) {
      if (field.required) {
        const value = responses[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          showError(`${field.label} is required`);
          return;
        }
      }
    }

    // Build responses array
    const formResponses: FormFieldResponse[] = formPayload.fields.map(field => ({
      field_id: field.id,
      value: responses[field.id] !== undefined ? responses[field.id] : null,
    }));

    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          form_id: formPayload.form_id,
          responses: formResponses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      success('Form submitted successfully');
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      showError(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: typeof formPayload.fields[0]) => {
    const value = responses[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateResponse(field.id, Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => updateResponse(field.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = value || [];
                    if (checked) {
                      updateResponse(field.id, [...current, option]);
                    } else {
                      updateResponse(field.id, current.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => updateResponse(field.id, checked)}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => updateResponse(field.id, val)}
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                updateResponse(field.id, file.name); // Store filename for now
                // TODO: Implement file upload to Supabase storage
              }
            }}
          />
        );

      default:
        return <p className="text-gray-500">Unsupported field type</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div>
        <h2 className="text-2xl font-bold">{formPayload.title}</h2>
        {formPayload.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {formPayload.description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      <Card className="p-6">
        <div className="space-y-6">
          {formPayload.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div key={field.id}>
                {field.type !== 'checkbox' && (
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                )}
                <div className="mt-1">
                  {renderField(field)}
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button onClick={validateAndSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
