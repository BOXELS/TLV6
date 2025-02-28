import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import JaneCategories from '../components/jane/JaneCategories';
import JanePrimaryVariants from '../components/jane/JanePrimaryVariants';
import JaneSecondaryVariants from '../components/jane/JaneSecondaryVariants';
import JaneStyles from '../components/jane/JaneStyles';
import TitleAppends from '../components/jane/TitleAppends';
import JaneVariantGroups from '../components/jane/JaneVariantGroups';

type TabType = 'categories' | 'primary-variants' | 'secondary-variants' | 'variant-groups' | 'styles' | 'title-appends';

export default function JaneSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');


  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">Jane Settings</h2>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('primary-variants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'primary-variants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Primary Variants
            </button>
            <button
              onClick={() => setActiveTab('secondary-variants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'secondary-variants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Secondary Variants
            </button>
            <button
              onClick={() => setActiveTab('variant-groups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'variant-groups'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Primary Variant Groups
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'styles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Style IDs
            </button>
            <button
              onClick={() => setActiveTab('title-appends')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'title-appends'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Append to Title
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'categories' && <JaneCategories />}
          {activeTab === 'primary-variants' && <JanePrimaryVariants />}
          {activeTab === 'secondary-variants' && <JaneSecondaryVariants />}
          {activeTab === 'variant-groups' && <JaneVariantGroups />}
          {activeTab === 'styles' && <JaneStyles />}
          {activeTab === 'title-appends' && <TitleAppends />}
        </div>
      </div>
    </DashboardLayout>
  );
}