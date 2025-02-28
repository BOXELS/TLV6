import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type MockupTemplate = {
  id: string;
  title: string;
  style_id: string;
  url: string;
  thumbnail_url: string;
  design_area: {
    points: { x: number; y: number }[];
  };
  stats?: {
    views: number;
    uses: number;
  };
  created_at: string;
};

type SortField = 'created_at' | 'title' | 'style_id' | 'views' | 'uses';
type SortDirection = 'asc' | 'desc';

export default function Mockups() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleIdFilter, setStyleIdFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Function to create SVG path from design area points
  const getDesignAreaPath = (points: { x: number; y: number }[]) => {
    if (!points || points.length < 3) return '';
    return points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`
    ).join(' ') + 'Z';
  };

  // Load templates on mount and when filters change
  useEffect(() => {
    loadTemplates();
  }, [searchQuery, styleIdFilter, sortField, sortDirection]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Get templates with stats
      const { data: templates, error } = await supabase
        .from('mockup_templates')
        .select(`
          *,
          mockup_stats (
            views,
            uses
          )
        `);

      if (error) throw error;

      // Transform data to include stats
      const templatesWithStats = (templates || []).map(template => ({
        ...template,
        stats: template.mockup_stats?.[0] || { views: 0, uses: 0 }
      }));

      let filteredTemplates = templatesWithStats;

      // Apply filters
      if (searchQuery) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (styleIdFilter) {
        filteredTemplates = filteredTemplates.filter(t =>
          t.style_id.toLowerCase().includes(styleIdFilter.toLowerCase())
        );
      }

      // Apply sorting
      filteredTemplates.sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        switch (sortField) {
          case 'title':
            return a.title.localeCompare(b.title) * direction;
          case 'style_id':
            return a.style_id.localeCompare(b.style_id) * direction;
          case 'views':
            return ((b.stats?.views || 0) - (a.stats?.views || 0)) * direction;
          case 'uses':
            return ((b.stats?.uses || 0) - (a.stats?.uses || 0)) * direction;
          case 'created_at':
          default:
            return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * direction;
        }
      });
        
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Mockup Templates {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Manage your mockup templates for design previews</p>
          </div>
          <button
            onClick={() => navigate('/mockups/add')}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style ID
              </label>
              <input
                type="text"
                value={styleIdFilter}
                onChange={(e) => setStyleIdFilter(e.target.value)}
                placeholder="Filter by style ID..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as SortField);
                  setSortDirection(direction as SortDirection);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="uses-desc">Most Used</option>
                <option value="views-desc">Most Viewed</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="style_id-asc">Style ID (A-Z)</option>
                <option value="style_id-desc">Style ID (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && !templates.length && (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading templates...</p>
            </div>
          )}

          {!loading && !templates.length && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No mockup templates found. Add your first template to get started.</p>
            </div>
          )}

          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative aspect-square bg-gray-50">
                <img
                  src={template.thumbnail_url || template.url}
                  alt={template.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {template.design_area?.points && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={getDesignAreaPath(template.design_area.points)}
                      fill="rgba(79, 70, 229, 0.1)"
                      stroke="rgba(79, 70, 229, 0.4)"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                  </svg>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1">Style ID: {template.style_id}</p>
                
                {/* Stats */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{template.stats?.views || 0} views</span>
                  <span>{template.stats?.uses || 0} uses</span>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/mockups/edit/${template.id}`)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <a
                    href={template.original_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Track download in stats
                      supabase.from('mockup_stats')
                        .upsert({
                          mockup_template_id: template.id,
                          views: template.stats?.views || 0,
                          uses: template.stats?.uses || 0,
                          last_viewed: new Date().toISOString()
                        })
                        .then(() => {
                          toast.success('Downloading mockup template...');
                        })
                        .catch((error) => {
                          console.error('Error tracking download:', error);
                        });
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}