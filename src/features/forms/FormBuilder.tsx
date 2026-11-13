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
import { FormField, FormFieldType } from "@/types/support-form.types";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface FormBuilderProps {
  initialTitle?: string;
  initialDescription?: string;
  initialFields?: FormField[];
  formId?: string;
  onSave?: (formId: string) => void;
  onCancel?: () => void;
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'file', label: 'File Upload' },
];

export function FormBuilder({
  initialTitle = '',
  initialDescription = '',
  initialFields = [],
  formId,
  onSave,
  onCancel,
}: FormBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [fields, setFields] = useState<FormField[]>(
    initialFields.length > 0 ? initialFields : [createEmptyField(0)]
  );
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  function createEmptyField(order: number): FormField {
    return {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      order,
    };
  }

  const addField = () => {
    setFields([...fields, createEmptyField(fields.length)]);
  };

  const removeField = (index: number) => {
    if (fields.length === 1) {
      showError('Form must have at least one field');
      return;
    }
    const newFields = fields.filter((_, i) => i !== index);
    // Reorder
    newFields.forEach((field, i) => {
      field.order = i;
    });
    setFields(newFields);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // Update order
    newFields.forEach((field, i) => {
      field.order = i;
    });
    
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Form title is required');
      return;
    }

    if (fields.length === 0) {
      showError('Form must have at least one field');
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        showError(`Field ${i + 1} must have a label`);
        return;
      }
    }

    setSaving(true);
    try {
      const endpoint = formId ? '/api/forms/update' : '/api/forms/create';
      const method = formId ? 'PUT' : 'POST';
      
      const payload: any = {
        title,
        description,
        fields,
      };

      if (formId) {
        payload.form_id = formId;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save form');
      }

      success(formId ? 'Form updated successfully' : 'Form created successfully');
      onSave?.(data.form.id);
    } catch (error: any) {
      console.error('Error saving form:', error);
      showError(error.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Metadata */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Form Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Patient Intake Form"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this form..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Form Fields</h3>
          <Button onClick={addField} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="p-4">
            <div className="space-y-4">
              {/* Field Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <span className="font-medium text-sm">Field {index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeField(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Field Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Label *</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="e.g., Full Name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value: FormFieldType) =>
                      updateField(index, { type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Placeholder (Optional)</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                  placeholder="e.g., Enter your full name"
                  className="mt-1"
                />
              </div>

              {/* Options for select/multiselect/radio */}
              {['select', 'multiselect', 'radio'].includes(field.type) && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(field.options || []).join('\n')}
                    onChange={(e) =>
                      updateField(index, {
                        options: e.target.value.split('\n').filter((o) => o.trim()),
                      })
                    }
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="mt-1"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    updateField(index, { required: checked as boolean })
                  }
                />
                <Label htmlFor={`required-${field.id}`} className="cursor-pointer">
                  Required field
                </Label>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {formId ? 'Update Form' : 'Create Form'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
