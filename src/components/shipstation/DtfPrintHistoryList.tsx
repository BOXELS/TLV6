import React from 'react';
import { Printer, Eye } from 'lucide-react';
import type { DtfPrintList } from '../../types/dtf';
import DtfPrintModal from './DtfPrintModal';

type DtfPrintHistoryListProps = {
  lists: DtfPrintList[];
  loading: boolean;
  credentials?: ShipstationCredentials;
  onOrdersUpdated?: () => void;
};

export default function DtfPrintHistoryList({ 
  lists, 
  loading,
  credentials,
  onOrdersUpdated 
}: DtfPrintHistoryListProps) {
  const [selectedList, setSelectedList] = React.useState<DtfPrintList | null>(null);

  if (loading) {
    return <div className="text-center py-8">Loading print history...</div>;
  }

  if (!lists.length) {
    return (
      <div className="text-center py-12">
        <Printer className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No print history</h3>
        <p className="mt-1 text-sm text-gray-500">No DTF print lists have been created yet</p>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Printed
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              # Designs
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Qty
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lists.map((list) => (
            <tr key={list.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(list.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {list.items.length}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {list.total_quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => setSelectedList(list)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                  title="View List"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Reprint List"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {selectedList && (
      <DtfPrintModal
        printList={selectedList.items}
        orders={selectedList.orders}
        credentials={credentials}
        onOrdersUpdated={onOrdersUpdated}
        onClose={() => setSelectedList(null)}
        readOnly
      />
    )}
    </>
  );
}