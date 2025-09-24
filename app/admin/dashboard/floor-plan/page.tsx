'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, MapPin } from 'lucide-react';
import FloorPlanEditor from '@/components/admin/FloorPlanEditor';
import FloorPlan from '@/components/booking/FloorPlan';

interface Table {
  id: string;
  tableNumber: number;
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  capacityMin: number;
  capacityMax: number;
  description: string;
  features: string[];
  isVip: boolean;
  isActive: boolean;
  canCombineWith: number[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

export default function FloorPlanPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<'UPSTAIRS' | 'DOWNSTAIRS'>('UPSTAIRS');
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load tables' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setMessage({ type: 'error', text: 'Failed to load tables' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleTableUpdate = async (updatedTable: Table) => {
    try {
      const response = await fetch(`/api/admin/tables/${updatedTable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTable)
      });

      if (response.ok) {
        const data = await response.json();
        setTables(prev => prev.map(t => t.id === data.id ? data : t));
        showMessage('success', `Table ${updatedTable.tableNumber} updated`);
      } else {
        showMessage('error', 'Failed to update table');
      }
    } catch (error) {
      console.error('Error updating table:', error);
      showMessage('error', 'Failed to update table');
    }
  };

  const handleTableAdd = async (newTable: Partial<Table>) => {
    try {
      const response = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable)
      });

      if (response.ok) {
        const data = await response.json();
        setTables(prev => [...prev, data]);
        showMessage('success', `Table ${newTable.tableNumber} added`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to add table');
      }
    } catch (error) {
      console.error('Error adding table:', error);
      showMessage('error', 'Failed to add table');
    }
  };

  const handleTableDelete = async (tableId: string) => {
    try {
      const response = await fetch(`/api/admin/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        showMessage('success', 'Table deleted successfully');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      showMessage('error', 'Failed to delete table');
    }
  };

  const handleSaveAll = async () => {
    try {
      const response = await fetch('/api/admin/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables })
      });

      if (response.ok) {
        showMessage('success', 'All changes saved successfully');
      } else {
        showMessage('error', 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      showMessage('error', 'Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-8 h-8 text-gold" />
            Floor Plan Editor
          </h1>
          <p className="text-gray-700 mt-1">
            Manage table positions and layout for the venue
          </p>
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            previewMode
              ? 'bg-gold text-speakeasy-charcoal'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          {previewMode ? 'Exit Preview' : 'Preview Mode'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Floor Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedFloor('UPSTAIRS')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              selectedFloor === 'UPSTAIRS'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upstairs - Main Floor ({tables.filter(t => t.floor === 'UPSTAIRS').length} tables)
          </button>
          <button
            onClick={() => setSelectedFloor('DOWNSTAIRS')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              selectedFloor === 'DOWNSTAIRS'
                ? 'bg-gold text-speakeasy-charcoal'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Downstairs - Speakeasy ({tables.filter(t => t.floor === 'DOWNSTAIRS').length} tables)
          </button>
        </div>
      </div>

      {/* Floor Plan Editor or Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        {previewMode ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Customer View Preview</h2>
            <FloorPlan
              floor={selectedFloor}
              tables={tables.filter(t => t.floor === selectedFloor).map(t => ({
                ...t,
                floor: t.floor as 'UPSTAIRS' | 'DOWNSTAIRS'
              }))}
              selectedTable={undefined}
              onTableSelect={() => {}}
              partySize={4}
              date={new Date().toISOString().split('T')[0]}
              bookedTables={[]}
              blockedTables={tables.filter(t => !t.isActive).map(t => t.tableNumber)}
            />
          </div>
        ) : (
          <FloorPlanEditor
            floor={selectedFloor}
            tables={tables}
            onTableUpdate={handleTableUpdate}
            onTableAdd={handleTableAdd}
            onTableDelete={handleTableDelete}
            onSaveAll={handleSaveAll}
            previewMode={false}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Tables</h3>
          <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Tables</h3>
          <p className="text-2xl font-bold text-green-600">
            {tables.filter(t => t.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">VIP Tables</h3>
          <p className="text-2xl font-bold text-gold">
            {tables.filter(t => t.isVip).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Capacity</h3>
          <p className="text-2xl font-bold text-gray-900">
            {tables.reduce((sum, t) => sum + t.capacityMax, 0)}
          </p>
        </div>
      </div>

      {/* Instructions */}
      {!previewMode && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to use the Floor Plan Editor:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Drag and drop tables to reposition them on the floor plan</li>
            <li>• Click on a table to select it and view/edit its properties</li>
            <li>• Use the &quot;Add Table&quot; button to create new tables</li>
            <li>• Changes are saved automatically when you move tables</li>
            <li>• Toggle between floors using the buttons above</li>
            <li>• Use &quot;Preview Mode&quot; to see how customers will view the floor plan</li>
          </ul>
        </div>
      )}
    </div>
  );
}