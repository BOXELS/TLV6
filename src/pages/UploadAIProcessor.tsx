import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import type { UploadItem } from '../types/upload';

export default function UploadAIProcessor() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = location.state?.items as UploadItem[];

  if (!items?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No items to process. Please select files first.</p>
          <button
            onClick={() => navigate('/upload-ai')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Upload AI
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/upload-ai')}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload AI
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Processing Files</h2>
          </div>
          <div className="text-sm text-gray-600">
            {items.length} files to process
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-8">
            {items.map((item, index) => (
              <div key={index} className="border-b pb-8 last:border-b-0">
                <div className="flex gap-6">
                  {/* Preview */}
                  <div className="w-48 h-48 flex-shrink-0">
                    <div className="w-full h-full bg-gray-50 rounded-lg border overflow-hidden">
                      <img
                        src={item.preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Status and Results */}
                  <div className="flex-1 space-y-4">
                    {/* Processing Status */}
                    <div className="flex items-center gap-2">
                      {item.processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                          <span className="text-sm text-gray-600">Processing...</span>
                        </>
                      ) : item.error ? (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm text-red-600">{item.error}</span>
                        </>
                      ) : item.result ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-600">Processing complete</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm text-gray-600">Waiting to process</span>
                        </>
                      )}
                    </div>

                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        SKU
                      </label>
                      <div className="mt-1 text-sm text-gray-900">
                        {item.sku}
                      </div>
                    </div>

                    {/* Generated Title */}
                    {item.result?.title && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Generated Title
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {item.result.title}
                        </p>
                      </div>
                    )}

                    {/* Generated Description */}
                    {item.result?.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Generated Description
                        </label>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.result.description}
                        </p>
                      </div>
                    )}

                    {/* Generated Keywords */}
                    {item.result?.keywords && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Generated Keywords
                        </label>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.result.keywords.map((keyword, kidx) => (
                            <span
                              key={kidx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Steps */}
                    {item.progress && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                          {item.progress.message}
                        </div>
                      </div>
                    )}
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