"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormBuilder } from "./FormBuilder";
import { SupportForm } from "@/types/support-form.types";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText,
  Loader2,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

export function FormManagementDashboard() {
  const [forms, setForms] = useState<(SupportForm & { submission_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<SupportForm | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/forms/list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch forms');
      }

      setForms(data.forms || []);
    } catch (error: any) {
      console.error('Error fetching forms:', error);
      showError(error.message || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/delete?form_id=${formId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete form');
      }

      success('Form deleted successfully');
      fetchForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      showError(error.message || 'Failed to delete form');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    fetchForms();
  };

  const handleEditSuccess = () => {
    setEditingForm(null);
    fetchForms();
  };

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Forms</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage forms to collect information from your clients
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forms..."
            className="pl-10"
          />
        </div>
      </Card>

      {/* Forms Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No forms found' : 'No forms yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first form to start collecting information'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {form.description || '-'}
                  </TableCell>
                  <TableCell>{form.fields?.length || 0}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {form.submission_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(form.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingForm(form)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/forms/${form.id}/submissions`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(form.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Build a custom form to collect information from your clients
            </DialogDescription>
          </DialogHeader>
          <FormBuilder
            onSave={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingForm && (
        <Dialog open={!!editingForm} onOpenChange={() => setEditingForm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Form</DialogTitle>
              <DialogDescription>
                Update your form fields and settings
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              formId={editingForm.id}
              initialTitle={editingForm.title}
              initialDescription={editingForm.description}
              initialFields={editingForm.fields}
              onSave={handleEditSuccess}
              onCancel={() => setEditingForm(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
