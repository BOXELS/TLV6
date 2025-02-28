import React from 'react';
import { useKeywords } from '../../hooks/useKeywords';
import { Tag, Hash, Calendar } from 'lucide-react';

export default function KeywordStats() {
  const { keywords, loading } = useKeywords();

  if (loading) {
    return null;
  }

  const totalKeywords = keywords.length;
  const totalUsage = keywords.reduce((sum, kw) => sum + (kw.usage_count || 0), 0);
  const avgUsage = totalKeywords ? Math.round(totalUsage / totalKeywords) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Keyword Statistics</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <Tag className="h-5 w-5 text-indigo-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Total Keywords</p>
            <p className="text-2xl font-semibold text-gray-900">{totalKeywords}</p>
          </div>
        </div>

        <div className="flex items-center">
          <Hash className="h-5 w-5 text-indigo-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Total Usage</p>
            <p className="text-2xl font-semibold text-gray-900">{totalUsage}</p>
          </div>
        </div>

        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500">Average Usage</p>
            <p className="text-2xl font-semibold text-gray-900">{avgUsage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}