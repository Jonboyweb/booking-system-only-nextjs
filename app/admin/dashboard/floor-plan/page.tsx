'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, MapPin } from 'lucide-react';
import FloorPlanEditorWithObjects from '@/components/admin/FloorPlanEditorWithObjects';
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

interface VenueObject {
  id: string;
  type: 'BAR' | 'DJ_BOOTH' | 'PARTITION' | 'DANCE_FLOOR' | 'EXIT' | 'STAIRCASE' | 'TOILETS' | 'CUSTOM';
  description: string;
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color?: string;
}

export default function FloorPlanPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [venueObjects, setVenueObjects] = useState<VenueObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<'UPSTAIRS' | 'DOWNSTAIRS'>('UPSTAIRS');
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tablesResponse, objectsResponse] = await Promise.all([
        fetch('/api/admin/tables'),
        fetch('/api/admin/venue-objects')
      ]);

      if (tablesResponse.ok) {
        const data = await tablesResponse.json();
        setTables(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load tables' });
        setTimeout(() => setMessage(null), 5000);
      }

      if (objectsResponse.ok) {
        const data = await objectsResponse.json();
        setVenueObjects(data);
      } else {
        console.warn('Failed to load venue objects');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load floor plan data' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleVenueObjectUpdate = async (updatedObject: VenueObject) => {
    try {
      const response = await fetch(`/api/admin/venue-objects/${updatedObject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObject)
      });

      if (response.ok) {
        const data = await response.json();
        setVenueObjects(prev => prev.map(o => o.id === data.id ? data : o));
        showMessage('success', `${updatedObject.description} updated`);
      } else {
        showMessage('error', 'Failed to update venue object');
      }
    } catch (error) {
      console.error('Error updating venue object:', error);
      showMessage('error', 'Failed to update venue object');
    }
  };

  const handleVenueObjectAdd = async (newObject: Partial<VenueObject>) => {
    try {
      const response = await fetch('/api/admin/venue-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObject)
      });

      if (response.ok) {
        const data = await response.json();
        setVenueObjects(prev => [...prev, data]);
        showMessage('success', `${newObject.description} added`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to add venue object');
      }
    } catch (error) {
      console.error('Error adding venue object:', error);
      showMessage('error', 'Failed to add venue object');
    }
  };

  const handleVenueObjectDelete = async (objectId: string) => {
    try {
      const response = await fetch(`/api/admin/venue-objects/${objectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVenueObjects(prev => prev.filter(o => o.id !== objectId));
        showMessage('success', 'Venue object deleted successfully');
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to delete venue object');
      }
    } catch (error) {
      console.error('Error deleting venue object:', error);
      showMessage('error', 'Failed to delete venue object');
    }
  };

  const handleSaveAll = async () => {
    try {
      const [tablesResponse, objectsResponse] = await Promise.all([
        fetch('/api/admin/tables', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tables })
        }),
        fetch('/api/admin/venue-objects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venueObjects })
        })
      ]);

      if (tablesResponse.ok && objectsResponse.ok) {
        showMessage('success', 'All changes saved successfully');
      } else {
        showMessage('error', 'Failed to save some changes');
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
          <FloorPlanEditorWithObjects
            floor={selectedFloor}
            tables={tables}
            venueObjects={venueObjects}
            onTableUpdate={handleTableUpdate}
            onTableAdd={handleTableAdd}
            onTableDelete={handleTableDelete}
            onVenueObjectUpdate={handleVenueObjectUpdate}
            onVenueObjectAdd={handleVenueObjectAdd}
            onVenueObjectDelete={handleVenueObjectDelete}
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
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Venue Objects</h3>
          <p className="text-2xl font-bold text-purple-600">
            {venueObjects.length}
          </p>
        </div>
      </div>

      {/* Instructions */}
      {!previewMode && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to use the Floor Plan Editor:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Basic Operations:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click on a table to select it and view its properties</li>
                <li>• Use the &quot;Add Table&quot; button to create new tables</li>
                <li>• Toggle between floors using the buttons above</li>
                <li>• Use &quot;Preview Mode&quot; to see the customer view</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Table Editing:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Move:</strong> Drag and drop tables to reposition</li>
                <li>• <strong>Resize:</strong> Drag the white handles on selected tables</li>
                <li>• <strong>Precise Move:</strong> Use arrow keys (hold Shift for 10px steps)</li>
                <li>• <strong>Edit Capacity:</strong> Click on capacity numbers to edit inline</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded p-2">
            <strong>Tips:</strong> Tables have a minimum size of 50x50 pixels. All changes are saved automatically.
            Press ESC to cancel inline editing. Selected tables show white borders with resize handles.
          </div>
        </div>
      )}
    </div>
  );
}