import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderOpen, Upload, Settings, FolderEdit, Tag, Users, UploadCloud, Package, Printer, ShoppingBag, Settings2, Edit2, Database, Sparkles, FileText, FileImage } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

const commonTools = [
  { name: 'Browse Files', icon: FolderOpen, path: '/dashboard' },
  { name: 'Upload Files', icon: Upload, path: '/upload' },
  { name: 'Bulk Upload', icon: UploadCloud, path: '/bulk-upload' },
  { name: 'Upload AI', icon: Sparkles, path: '/upload-ai' },
  { name: 'Settings', icon: Settings, path: '/settings' }
];

const shipstationTools = [
  { name: 'Orders', icon: Package, path: '/shipstation' },
  { name: 'Tags', icon: Tag, path: '/shipstation/tags' }
];

const ssaTools = [
  { name: 'Orders', icon: ShoppingBag, path: '/ssa/orders' },
  { name: 'Order History', icon: Package, path: '/ssa/order-history' }
];

const adminTools = [
  { name: 'Categories', icon: FolderEdit, path: '/categories' },
  { name: 'Keywords', icon: Tag, path: '/keywords' },
  { name: 'Clothing Styles', icon: Tag, path: '/clothing-styles' },
  { name: 'Users', icon: Users, path: '/users' },
  { name: 'Mockups', icon: FileImage, path: '/mockups' },
  { name: 'Version History', icon: FileText, path: '/version-history' },
  { name: 'Edit Titles', icon: Edit2, path: '/edit-titles' },
  { name: 'Jane Settings', icon: Settings2, path: '/jane-settings' }
];

export default function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useAdmin();

  return (
    <div className="h-full bg-white border-r border-gray-200 w-64 flex-shrink-0">
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex-1 px-3 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Tools</h2>
              <nav className="space-y-1">
                {commonTools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100 hover:text-gray-900 ${
                      location.pathname === tool.path
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <tool.icon className="mr-3 h-5 w-5" />
                    {tool.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">SSA</h2>
              <nav className="space-y-1">
                {ssaTools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100 hover:text-gray-900 ${
                      location.pathname === tool.path
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <tool.icon className="mr-3 h-5 w-5" />
                    {tool.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Shipstation</h2>
              <nav className="space-y-1">
                {shipstationTools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.path}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100 hover:text-gray-900 ${
                      location.pathname === tool.path
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <tool.icon className="mr-3 h-5 w-5" />
                    {tool.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Only show admin tools section if user is admin */}
            {isAdmin && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Admin</h2>
                <nav className="space-y-1">
                  {adminTools.map((tool) => (
                    <Link
                      key={tool.name}
                      to={tool.path}
                      className={`flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100 hover:text-gray-900 ${
                        location.pathname === tool.path
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <tool.icon className="mr-3 h-5 w-5" />
                      {tool.name}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}