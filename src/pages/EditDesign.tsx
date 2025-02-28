import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analyzeImage } from '../utils/openai';
import DashboardLayout from '../components/DashboardLayout';
import MockupGeneratorV2 from '../components/browse/MockupGeneratorV2';
import { useAdmin } from '../hooks/useAdmin';
import { bulkDeleteDesigns } from '../utils/bulkOperations';
import EditDesignForm from '../components/browse/EditDesignForm';
import EditFileSection from '../components/browse/EditFileSection';
import { Sparkles, Tag } from 'lucide-react';
import type { DesignFile } from '../types/database';
import { uploadFile, uploadMockupFile } from '../utils/fileUpload';
import toast from 'react-hot-toast';

export default function EditDesign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [design, setDesign] = useState<DesignFile | null>(null);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [hasFileChanges, setHasFileChanges] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [savingMockups, setSavingMockups] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);

  // Track form changes
  useEffect(() => {
    if (!design) return;
    
    const hasChanges =
      hasFileChanges ||
      title !== design.title ||
      description !== (design.description || '') ||
      JSON.stringify(selectedCategories.sort()) !== JSON.stringify((design.categories?.map(c => c.category_id) || []).sort()) ||
      JSON.stringify(keywords.sort()) !== JSON.stringify((design.design_keyword_links?.map(k => k.keywords?.keyword).filter(Boolean) || []).sort());
    
    setHasFormChanges(hasChanges);
  }, [title, description, selectedCategories, keywords, design, hasFileChanges]);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('design_files')
        .select(`
          *,
          design_keyword_links (
            keywords (
              keyword
            )
          ),
          categories:design_categories (
            category_id,
            categories (
              id,
              name
            )
          ),
          design_mockups (
            id,
            url,
            thumb_url,
            sort_order,
            is_main
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Sort mockups by sort_order
      const sortedMockups = [...(data.design_mockups || [])].sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      // Update the data with sorted mockups
      data.mockups = sortedMockups;
      delete data.design_mockups;
      setDesign(data);
      setTitle(data.title);
      setSku(data.sku);
      setDescription(data.description || '');
      setSelectedCategories(data.categories?.map(c => c.category_id) || []);
      setKeywords(data.design_keyword_links?.map(k => k.keywords?.keyword).filter(Boolean) || []);
    } catch (error) {
      console.error('Error loading design:', error);
      toast.error('Failed to load design');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMockups = async () => {
    if (!design || !mockupFiles.length) return;

    console.group('Uploading mockups');
    console.log('Design:', { id: design.id, sku: design.sku });
    console.log('Number of files:', mockupFiles.length);

    setSavingMockups(true);
    try {
      const mockupUrls = [];
      for (const mockupFile of mockupFiles) {
        console.log('Uploading mockup:', mockupFile.name);
        const { url, thumbUrl, sort_order } = await uploadMockupFile(mockupFile, '', design.sku, design.id, {
          backgroundColor: 'white'
        });
        console.log('Mockup uploaded:', { url, thumbUrl, sort_order });
        mockupUrls.push({ url, thumbUrl, sort_order });
      }

      console.log('Saving mockups to database:', mockupUrls);
      const { error: mockupsError } = await supabase
        .from('design_mockups')
        .insert(
          mockupUrls.map((mockup, index) => ({
            design_id: design.id,
            url: mockup.url,
            thumb_url: mockup.thumbUrl,
            sort_order: index
          }))
        );

      if (mockupsError) throw mockupsError;
      
      setMockupFiles([]); // Clear uploaded files
      console.log('Refreshing design data');
      await loadDesign(); // Refresh design data
      toast.success('Mockups uploaded successfully');
    } catch (error) {
      console.error('Error uploading mockups:', error);
      toast.error('Failed to upload mockups');
    } finally {
      console.groupEnd();
      setSavingMockups(false);
    }
  };

  const handleSave = async () => {
    if (!design) return;

    setSaving(true);
    try {
      const normalizedTitle = title.replace(/\s+/g, ' ').trim();
      const updates: any = { 
        title: normalizedTitle,
        description
      };
      
      // Handle file upload if new file selected
      if (printFile) {
        const fileExt = printFile.name.substring(printFile.name.lastIndexOf('.'));
        const filePath = `prints/${sku}${fileExt}`;
        
        const { printUrl, webUrl } = await uploadFile(printFile, filePath, {
          backgroundColor
        });
        updates.print_file_url = printUrl;
        updates.web_file_url = webUrl;
      }

      // Update design record
      const { error: designError } = await supabase
        .from('design_files')
        .update(updates)
        .eq('id', design.id);

      if (designError) throw designError;

      // Update categories
      await supabase
        .from('design_categories')
        .delete()
        .eq('design_id', design.id);

      if (selectedCategories.length > 0) {
        const { error: categoriesError } = await supabase
          .from('design_categories')
          .insert(
            selectedCategories.map(categoryId => ({
              design_id: design.id,
              category_id: categoryId,
            }))
          );

        if (categoriesError) throw categoriesError;
      }

      // Update keywords
      await supabase
        .from('design_keyword_links')
        .delete()
        .eq('design_id', design.id);

      if (keywords.length > 0) {
        // Ensure all keywords exist
        for (const keyword of keywords) {
          const { data: existing } = await supabase
            .from('keywords')
            .select('id')
            .eq('keyword', keyword)
            .maybeSingle();

          if (!existing) {
            await supabase
              .from('keywords')
              .insert({ keyword });
          }
        }

        // Get all keyword IDs
        const { data: keywordRecords } = await supabase
          .from('keywords')
          .select('id')
          .in('keyword', keywords);

        if (keywordRecords?.length) {
          const { error: linksError } = await supabase
            .from('design_keyword_links')
            .insert(
              keywordRecords.map(kr => ({
                design_id: design.id,
                keyword_id: kr.id
              }))
            );

          if (linksError) throw linksError;
        }
      }

      await loadDesign();
      toast.success('Design updated successfully');
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!design || !isAdmin) return;

    const confirmMessage = 'Are you sure you want to delete this design? This action cannot be undone and will remove all associated files, mockups, and database records.';
    
    if (!window.confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      console.log('Deleting design:', design.id);
      await bulkDeleteDesigns([design]);
      toast.success('Design deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
      setDeleting(false);
      return; // Prevent navigation on error
    }
  };

  const handleSwitchBackground = async () => {
    if (!design || switchingBackground) return;
    
    setSwitchingBackground(true);
    try {
      // Create web thumbnail with new background color
      const response = await fetch(design.print_file_url);
      const blob = await response.blob();
      const printFile = new File([blob], `${design.sku}.png`, { type: 'image/png' });
      
      const webFile = await createWebThumbnail(printFile, {
        maxSize: 800,
        backgroundColor: backgroundColor === 'white' ? 'black' : 'white'
      });

      // Upload new web thumbnail
      const webPath = `prints/${design.sku}_web.png`;
      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(webPath, webFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get new public URL
      const { data: { publicUrl: webUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(webPath);

      // Update design record
      const { error: updateError } = await supabase
        .from('design_files')
        .update({ web_file_url: webUrl })
        .eq('id', design.id);

      if (updateError) throw updateError;

      // Toggle background color
      setBackgroundColor(prev => prev === 'white' ? 'black' : 'white');
      
      // Reload design to get updated URLs
      await loadDesign();
      toast.success('Background color updated successfully');
    } catch (error) {
      console.error('Error switching background:', error);
      toast.error('Failed to switch background color');
    } finally {
      setSwitchingBackground(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading design...</div>
      </DashboardLayout>
    );
  }

  if (!design) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Design not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              ← Back to Design Files
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Edit Design</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!design) return;
                setAnalyzing(true);
                try {
                  // Fetch the image file
                  const response = await fetch(design.web_file_url);
                  const blob = await response.blob();
                  const file = new File([blob], `${design.sku}.png`, { type: 'image/png' });

                  // Analyze with AI
                  const result = await analyzeImage(file);
                  if (!result) throw new Error('Failed to analyze image');

                  // Update form fields
                  setTitle(result.title);
                  setDescription(result.description);
                  // Merge new keywords with existing ones
                  const uniqueKeywords = new Set([...keywords, ...result.keywords]);
                  setKeywords(Array.from(uniqueKeywords));
                  toast.success('AI suggestions generated successfully');
                } catch (error) {
                  console.error('Error getting AI suggestions:', error);
                  toast.error('Failed to get AI suggestions');
                } finally {
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                  Getting Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Suggestions
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/jane-export', { state: { designs: [design] } })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Jane CSV Export
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasFormChanges}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 mr-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Design'}
              </button>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <EditFileSection 
                design={design}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                onFileUploaded={(file) => {
                  setPrintFile(file);
                  setHasFileChanges(true);
                }}
                mockupFiles={mockupFiles}
                onMockupsChange={(files) => {
                  setMockupFiles(prev => [...prev, ...files]);
                }}
                onSaveMockups={handleSaveMockups}
                savingMockups={savingMockups}
                hasPendingMockups={mockupFiles.length > 0}
                onSetMainMockup={async (mockupId) => {
                  try {
                    const { error } = await supabase.rpc('set_main_mockup', {
                      p_mockup_id: mockupId,
                      p_design_id: design.id
                    });

                    if (error) throw error;
                    await loadDesign();
                    toast.success('Main image updated');
                  } catch (error) {
                    console.error('Error setting main image:', error);
                    toast.error('Failed to update main image');
                  }
                }}
                onReorderMockups={async (mockupIds) => {
                  try {
                    const { error } = await supabase.rpc('update_mockup_order', {
                      p_mockup_ids: mockupIds,
                      p_design_id: design.id
                    });

                    if (error) throw error;
                    await loadDesign();
                  } catch (error) {
                    console.error('Error reordering mockups:', error);
                    toast.error('Failed to reorder mockups');
                  }
                }}
                onRemoveMockup={async (mockupIds) => {
                  try {
                    const mockupsToDelete = design.mockups?.filter(m => mockupIds.includes(m.id)) || [];
                    if (mockupsToDelete.length === 0) return;

                    const { error: deleteError } = await supabase
                      .from('design_mockups')
                      .delete()
                      .in('id', mockupIds);

                    if (deleteError) throw deleteError;

                    const filesToDelete = mockupsToDelete.flatMap(mockup => [
                      mockup.url.split('designs/')[1],
                      mockup.thumb_url.split('designs/')[1]
                    ]);

                    await supabase.storage
                      .from('designs')
                      .remove(filesToDelete);

                    await loadDesign();
                    toast.success(`${mockupIds.length} mockup${mockupIds.length > 1 ? 's' : ''} deleted`);
                  } catch (error) {
                    console.error('Error deleting mockup:', error);
                    toast.error('Failed to delete mockup');
                  }
                }}
              />
            </div>

            <div>
              <EditDesignForm
                title={title}
                description={description}
                sku={sku}
                design={design}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onSkuChange={setSku}
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                onCategoriesUpdate={setCategories}
                keywords={keywords}
                onKeywordsChange={setKeywords}
                onMockupsChange={(files) => {
                  setMockupFiles(prev => [...prev, ...files]);
                }}
              />
            </div>
          </div>
        </div>

        {/* Mockup Generator Section */}
        <div className="mt-6">
          <MockupGeneratorV2 
            design={design}
            onMockupsGenerated={(files) => {
              setMockupFiles(prev => [...prev, ...files]);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}