import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { analyzeTitleOnly } from '../utils/openai';
import toast from 'react-hot-toast';
import type { DesignFile } from '../types/database';

export default function EditTitles() {
  const location = useLocation();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<DesignFile[]>(
    location.state?.designs || []
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>(
    designs.reduce((acc, design) => ({
      ...acc,
      [design.id]: design.description || ''
    }), {})
  );

  // Initialize editedDescriptions when designs change
  useEffect(() => {
    if (designs.length > 0) {
      const initialDescriptions = designs.reduce((acc, design) => ({
        ...acc,
        [design.id]: design.description || ''
      }), {});
      setEditedDescriptions(initialDescriptions);
    }
  }, [designs]);

  if (!designs?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select designs to edit from the dashboard.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = async (id: string, newTitle: string, newDescription: string | null, index: number) => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      // Always include both title and description in updates
      const updates = {
        title: newTitle.trim(),
        description: newDescription?.trim() || ''
      };

      // Update title
      const { error } = await supabase 
        .from('design_files')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const updatedDesigns = [...designs];
      updatedDesigns[index] = {
        ...updatedDesigns[index],
        title: newTitle.trim(),
        description: newDescription !== null 
          ? newDescription.trim() 
          : updatedDesigns[index].description
      };
      setDesigns(updatedDesigns);
      setEditedTitles(prev => ({ ...prev, [id]: newTitle.trim() }));
      if (newDescription !== null) {
        setEditedDescriptions(prev => ({ ...prev, [id]: newDescription.trim() }));
      }

      // Show success indicator
      setSuccess(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, [id]: false }));
      }, 2000);

    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleAnalyzeWithAI = async (id: string, index: number) => {
    if (analyzing[id]) return;

    setAnalyzing(prev => ({ ...prev, [id]: true }));
    try {
      // Get the design
      const design = designs[index];
      
      // Fetch the image file
      const response = await fetch(design.web_file_url);
      const blob = await response.blob();
      const file = new File([blob], `${design.sku}.png`, { type: 'image/png' });

      // Analyze with AI
      const result = await analyzeTitleOnly(file);
      if (!result) throw new Error('Failed to analyze image');

      // Update the title
      await handleSave(id, result.title, result.description, index);
      toast.success('Title updated with AI suggestion');
      setEditedTitles(prev => ({ ...prev, [id]: result.title }));
      setEditedDescriptions(prev => ({ ...prev, [id]: result.description }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setAnalyzing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, design: DesignFile, index: number) => {
    if (e.key === 'Tab') {
      // Don't prevent default - let natural tab behavior work
      const input = e.currentTarget;
      if (input.value !== design.title) {
        handleSave(design.id, input.value, null, index);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const input = e.currentTarget;
      if (input.value !== design.title) {
        handleSave(design.id, input.value, null, index);
      }
      // Focus next input if available
      const nextInput = document.querySelector<HTMLInputElement>(`input[data-index="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Edit Titles</h2>
          </div>
          <div className="text-sm text-gray-500">
            {designs.length} designs selected
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 divide-y">
            {designs.map((design, index) => (
              <div key={design.id} className="p-4">
                <div className="flex gap-6">
                  {/* Design Preview */}
                  <div className="flex gap-4 w-64 flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-50 rounded flex-shrink-0">
                      <img
                        src={design.web_file_url}
                        alt={design.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {design.mockups?.[0] && (
                      <div className="w-24 h-24 bg-gray-50 rounded flex-shrink-0">
                        <img
                          src={design.mockups[0].thumb_url}
                          alt={`${design.title} mockup`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title Editor */}
                  <div className="flex-1 space-y-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          key={`input-${index}`}
                          type="text"
                          value={editedTitles[design.id] || design.title}
                          onChange={(e) => {
                            setEditedTitles(prev => ({
                              ...prev,
                              [design.id]: e.target.value
                            }));
                          }}
                          data-index={index}
                          onBlur={(e) => {
                            if (e.target.value !== (editedTitles[design.id] || design.title)) {
                              handleSave(design.id, e.target.value, null, index);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, design, index)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleAnalyzeWithAI(design.id, index)}
                          disabled={analyzing[design.id]}
                          className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          title="Generate with AI"
                        >
                          <Sparkles className={`w-4 h-4 ${analyzing[design.id] ? 'animate-spin' : ''}`} />
                        </button>
                        {saving[design.id] && (
                          <span className="text-gray-400">Saving...</span>
                        )}
                        {success[design.id] && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-gray-500">{design.sku}</div>
                        
                        <textarea
                          value={editedDescriptions[design.id] || design.description || ''}
                          onChange={(e) => {
                            setEditedDescriptions(prev => ({
                              ...prev,
                              [design.id]: e.target.value
                            }));
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== (editedDescriptions[design.id] || design.description || '')) {
                              handleSave(design.id, editedTitles[design.id] || design.title, e.target.value, index);
                            }
                          }}
                          placeholder="Description"
                          rows={2}
                          className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}