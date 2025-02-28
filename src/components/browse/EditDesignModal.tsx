import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { uploadFile, uploadMockupFile } from '../../utils/fileUpload';
import type { DesignFile } from '../../types/database';
import EditDesignForm from './EditDesignForm';
import EditFileSection from './EditFileSection';

type EditDesignModalProps = {
  design: DesignFile;
  onClose: () => void;
  onUpdate: () => Promise<void>;
};

export default function EditDesignModal({ design, onClose, onUpdate }: EditDesignModalProps) {
  const [loading, setLoading] = useState(false);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [title, setTitle] = useState(design.title);
  const [originalSku] = useState(design.sku);
  const [sku, setSku] = useState(design.sku);
  const [skuAcronym, setSkuAcronym] = useState(design.sku.split('-')[1] || '');
  const [categories, setCategories] = useState(design.categories || []);
  const [selectedCategories, setSelectedCategories] = useState(
    design.categories?.map(c => c.category_id) || []
  );
  const [keywords, setKeywords] = useState(
    design.keywords?.map(k => k.keyword) || []
  );
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>(
    design.mockups?.map(m => m.url) || []
  );
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasFormChanges = 
      title !== design.title ||
      sku !== design.sku ||
      JSON.stringify(selectedCategories.sort()) !== JSON.stringify((design.categories?.map(c => c.category_id) || []).sort()) ||
      JSON.stringify(keywords.sort()) !== JSON.stringify((design.keywords?.map(k => k.keyword) || []).sort());
    
    setHasChanges(hasFormChanges);
  }, [title, sku, selectedCategories, keywords, design]);

  const handleInternalUpdate = async () => {
    setIsInternalUpdate(true);
    try {
      await onUpdate();
    } finally {
      setIsInternalUpdate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        title,
      };

      // Handle SKU change and file paths
      if (sku !== originalSku) {
        // Get file extensions from current URLs
        const printPath = `prints/${originalSku}${design.print_file_url.substring(design.print_file_url.lastIndexOf('.'))}`;
        const webPath = `prints/${originalSku}_web${design.web_file_url.substring(design.web_file_url.lastIndexOf('.'))}`;
        
        // Generate new file paths
        const newPrintPath = `prints/${sku}${design.print_file_url.substring(design.print_file_url.lastIndexOf('.'))}`;
        const newWebPath = `prints/${sku}_web${design.web_file_url.substring(design.web_file_url.lastIndexOf('.'))}`;

        try {
          // Copy existing files to new paths
          const { data: printData } = await supabase.storage
            .from('designs')
            .copy(printPath, newPrintPath);

          const { data: webData } = await supabase.storage
            .from('designs')
            .copy(webPath, newWebPath);

          if (!printData || !webData) {
            throw new Error('Failed to copy files');
          }

          // Get new public URLs
          const { data: { publicUrl: printUrl } } = supabase.storage
            .from('designs')
            .getPublicUrl(newPrintPath);

          const { data: { publicUrl: webUrl } } = supabase.storage
            .from('designs')
            .getPublicUrl(newWebPath);

          // Delete old files
          await supabase.storage
            .from('designs')
            .remove([printPath, webPath]);

          // Update the URLs and SKU
          updates.sku = sku;
          updates.print_file_url = printUrl;
          updates.web_file_url = webUrl;
        } catch (error) {
          console.error('Storage operation failed:', error);
          throw new Error('Failed to update file paths');
        }
      }

      // Upload new file if provided
      if (printFile) {
        const fileExt = printFile.name.substring(printFile.name.lastIndexOf('.'));
        const filePath = `prints/${sku}${fileExt}`;
        
        try {
          const { printUrl, webUrl } = await uploadFile(printFile, filePath);
          updates.print_file_url = printUrl;
          updates.web_file_url = webUrl;

          // If we're also changing SKU, delete the old files
          if (sku !== originalSku) {
            await supabase.storage
              .from('designs')
              .remove([design.print_file_url, design.web_file_url]);
          }
        } catch (error) {
          console.error('File upload error:', error);
          toast.error('Failed to upload new file');
          return;
        }
      }

      // Handle mockup uploads
      if (mockupFiles.length > 0) {
        const mockupUrls = [];
        for (const mockupFile of mockupFiles) {
          const { url, thumbUrl, sort_order } = await uploadMockupFile(mockupFile, '', sku, design.id, {
            backgroundColor: 'white'
          });
          mockupUrls.push({ url, thumbUrl, sort_order });
        }

        // Add new mockups
        const { error: mockupsError } = await supabase
          .from('design_mockups')
          .insert(
            mockupUrls.map(({ url, thumbUrl }) => ({
              design_id: design.id,
              url,
             thumb_url: thumbUrl,
             sort_order: mockupUrls.indexOf(mockupUrl)
            }))
          );

        if (mockupsError) throw mockupsError;
      }

      // Update design record
      const { error: designError } = await supabase
        .from('design_files')
        .update(updates)
        .eq('id', design.id);

      if (designError) throw new Error('Failed to update design details');

      // Update categories
      const { error: categoriesDeleteError } = await supabase
        .from('design_categories')
        .delete()
        .eq('design_id', design.id);

      if (categoriesDeleteError) throw new Error('Failed to update categories');

      if (selectedCategories.length > 0) {
        const { error: categoriesError