'use client';

import { useEffect, useState } from 'react';
import { Calendar, Lock, Shield } from 'lucide-react';
import TableBlockModal from '@/components/admin/TableBlockModal';
import TableBlocksList from '@/components/admin/TableBlocksList';

interface Table {
  id: string;
  tableNumber: number;
  floor: string;
  capacityMin: number;
  capacityMax: number;
  description: string;
  features: string[];
  isVip: boolean;
  isActive: boolean;
  canCombineWith: number[];
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [refreshBlocks, setRefreshBlocks] = useState(0);
  const [activeTab, setActiveTab] = useState<'tables' | 'blocks'>('tables');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables/all');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableStatus = async (tableId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        fetchTables();
      }
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  const openBlockModal = (table: Table) => {
    setSelectedTable(table);
    setShowBlockModal(true);
  };

  const handleBlockSuccess = () => {
    setRefreshBlocks(prev => prev + 1);
  };

  const filteredTables = tables.filter(table => {
    if (selectedFloor === 'all') return true;
    return table.floor === selectedFloor;
  });

  if (loading) {
    return <div className="text-center py-8">Loading tables...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-700 mt-1">Manage venue tables and availability</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === 'tables'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Tables
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              activeTab === 'blocks'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Date Blocks
          </button>
        </div>
      </div>

      {activeTab === 'tables' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedFloor('all')}
            className={`px-4 py-2 rounded-md ${
              selectedFloor === 'all'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Floors ({tables.length})
          </button>
          <button
            onClick={() => setSelectedFloor('UPSTAIRS')}
            className={`px-4 py-2 rounded-md ${
              selectedFloor === 'UPSTAIRS'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upstairs ({tables.filter(t => t.floor === 'UPSTAIRS').length})
          </button>
          <button
            onClick={() => setSelectedFloor('DOWNSTAIRS')}
            className={`px-4 py-2 rounded-md ${
              selectedFloor === 'DOWNSTAIRS'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Downstairs ({tables.filter(t => t.floor === 'DOWNSTAIRS').length})
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className={`px-6 py-4 ${table.isVip ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-xl font-bold ${table.isVip ? 'text-white' : 'text-gray-900'}`}>
                    Table {table.tableNumber}
                  </h3>
                  <p className={`text-sm ${table.isVip ? 'text-yellow-100' : 'text-gray-700'}`}>
                    {table.floor}
                  </p>
                </div>
                {table.isVip && (
                  <span className="bg-white text-yellow-600 px-2 py-1 rounded text-xs font-bold">
                    VIP
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700">Capacity</p>
                  <p className="font-medium">{table.capacityMin}-{table.capacityMax} guests</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-700">Description</p>
                  <p className="text-sm">{table.description}</p>
                </div>
                
                {table.features.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700">Features</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {table.features.map((feature, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {table.canCombineWith.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700">Can combine with</p>
                    <p className="text-sm">Tables {table.canCombineWith.join(', ')}</p>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      table.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {table.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openBlockModal(table)}
                        className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Block Dates
                      </button>
                      <button
                        onClick={() => toggleTableStatus(table.id, table.isActive)}
                        className={`px-3 py-1 rounded text-sm ${
                          table.isActive
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {table.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Venue Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-700">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Active Tables</p>
                <p className="text-2xl font-bold text-green-600">
                  {tables.filter(t => t.isActive).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">VIP Tables</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tables.filter(t => t.isVip).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {tables.reduce((sum, t) => sum + t.capacityMax, 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <TableBlocksList refreshTrigger={refreshBlocks} />
      )}

      {/* Block Modal */}
      {showBlockModal && selectedTable && (
        <TableBlockModal
          table={selectedTable}
          onClose={() => setShowBlockModal(false)}
          onSuccess={handleBlockSuccess}
        />
      )}
    </div>
  );
}