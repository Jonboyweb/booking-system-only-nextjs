'use client';

import { useState, useRef } from 'react';
import { Plus, Save, Edit2, Trash2, Move } from 'lucide-react';

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

interface FloorPlanEditorProps {
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  tables: Table[];
  onTableUpdate: (table: Table) => Promise<void>;
  onTableAdd: (table: Partial<Table>) => Promise<void>;
  onTableDelete: (tableId: string) => Promise<void>;
  onSaveAll: () => Promise<void>;
  previewMode?: boolean;
}

export default function FloorPlanEditor({
  floor,
  tables,
  onTableUpdate,
  onTableAdd,
  onTableDelete,
  onSaveAll,
  previewMode = false
}: FloorPlanEditorProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const floorTables = tables.filter(t => t.floor === floor);

  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, table: Table) => {
    if (previewMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    setDraggedTable(table);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedTable || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 650 / svgRect.width; // SVG viewBox width / actual width

    const newX = Math.max(0, Math.min(650 - draggedTable.width,
      (e.clientX - svgRect.left - dragOffset.x) * scale));
    const newY = Math.max(0, Math.min(450 - draggedTable.height,
      (e.clientY - svgRect.top - dragOffset.y) * scale));

    const updatedTable = {
      ...draggedTable,
      positionX: Math.round(newX),
      positionY: Math.round(newY)
    };

    const index = floorTables.findIndex(t => t.id === draggedTable.id);
    if (index !== -1) {
      floorTables[index] = updatedTable;
      setDraggedTable(updatedTable);
      setUnsavedChanges(true);
    }
  };

  const handleMouseUp = async () => {
    if (draggedTable) {
      await onTableUpdate(draggedTable);
      setDraggedTable(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleTableEdit = (table: Table) => {
    setEditingTable({ ...table });
    setSelectedTable(null);
  };

  const handleTableSave = async () => {
    if (editingTable) {
      await onTableUpdate(editingTable);
      setEditingTable(null);
      setUnsavedChanges(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newTable: Partial<Table> = {
      tableNumber: parseInt(formData.get('tableNumber') as string),
      floor: floor,
      capacityMin: parseInt(formData.get('capacityMin') as string),
      capacityMax: parseInt(formData.get('capacityMax') as string),
      description: formData.get('description') as string,
      features: (formData.get('features') as string).split(',').map(f => f.trim()).filter(Boolean),
      isVip: formData.get('isVip') === 'on',
      isActive: true,
      canCombineWith: [],
      positionX: 300,
      positionY: 200,
      width: 100,
      height: 80
    };

    await onTableAdd(newTable);
    setShowAddForm(false);
  };

  const getTableColor = (table: Table) => {
    if (!table.isActive) return '#666666';
    if (table.isVip) return '#D4AF37';
    return '#2E5F45';
  };

  return (
    <div className="relative">
      {/* Controls */}
      {!previewMode && (
        <div className="mb-4 flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
            {unsavedChanges && (
              <button
                onClick={onSaveAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save All Changes
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <Move className="w-4 h-4 inline mr-1" />
            Drag tables to reposition
          </div>
        </div>
      )}

      {/* Add Table Form */}
      {showAddForm && !previewMode && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-2">Add New Table</h3>
          <form onSubmit={handleAddTable} className="grid grid-cols-2 gap-3">
            <input
              name="tableNumber"
              type="number"
              placeholder="Table Number"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              name="description"
              type="text"
              placeholder="Description"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              name="capacityMin"
              type="number"
              placeholder="Min Capacity"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              name="capacityMax"
              type="number"
              placeholder="Max Capacity"
              className="px-3 py-2 border rounded"
              required
            />
            <input
              name="features"
              type="text"
              placeholder="Features (comma separated)"
              className="px-3 py-2 border rounded col-span-2"
            />
            <label className="flex items-center gap-2">
              <input name="isVip" type="checkbox" />
              VIP Table
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floor Plan */}
      <div className="relative bg-charcoal p-6 rounded-lg border-2 border-gold">
        <h3 className="text-2xl font-bebas text-gold mb-4">
          {floor === 'UPSTAIRS' ? 'Upstairs - Main Floor' : 'Downstairs - Speakeasy'}
          {previewMode && <span className="text-sm ml-2">(Preview Mode)</span>}
        </h3>

        <svg
          ref={svgRef}
          width="650"
          height="450"
          className="w-full h-auto cursor-move"
          viewBox="0 0 650 450"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background */}
          <defs>
            <pattern id="artDeco" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0 L20 40 M0 20 L40 20" stroke="#2a2a2a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="650" height="450" fill="#1a1a1a" />
          <rect width="650" height="450" fill="url(#artDeco)" />

          {/* Stage/DJ Booth for upstairs */}
          {floor === 'UPSTAIRS' && (
            <>
              <rect x="525" y="0" width="75" height="30" fill="#2a2a2a" stroke="#D4AF37" strokeWidth="2" />
              <text x="562.5" y="20" textAnchor="middle" fill="#D4AF37" className="font-poiret text-sm">
                DJ
              </text>
            </>
          )}

          {/* Bar area */}
          <rect x="50" y="0" width="250" height="30" fill="#2a2a2a" stroke="#D4AF37" strokeWidth="1" />
          <text x="175" y="20" textAnchor="middle" fill="#D4AF37" className="font-poiret text-sm">
            BAR
          </text>

          {/* Render tables */}
          {floorTables.map(table => (
            <g key={table.id}>
              <rect
                x={table.positionX}
                y={table.positionY}
                width={table.width}
                height={table.height}
                fill={getTableColor(table)}
                stroke={selectedTable?.id === table.id ? '#FFF' : '#666'}
                strokeWidth={selectedTable?.id === table.id ? 3 : 1}
                opacity={table.isActive ? 1 : 0.5}
                className={previewMode ? '' : 'cursor-move hover:stroke-2'}
                onMouseDown={(e) => handleMouseDown(e, table)}
                onClick={() => !draggedTable && setSelectedTable(table)}
              />

              {/* Table number */}
              <text
                x={table.positionX + table.width / 2}
                y={table.positionY + table.height / 2 - 10}
                textAnchor="middle"
                fill="#F5F5DC"
                className="font-bebas text-lg pointer-events-none select-none"
              >
                {table.tableNumber}
              </text>

              {/* VIP indicator */}
              {table.isVip && (
                <text
                  x={table.positionX + table.width / 2}
                  y={table.positionY + table.height / 2 + 10}
                  textAnchor="middle"
                  fill="#D4AF37"
                  className="font-poiret text-xs pointer-events-none select-none"
                >
                  VIP
                </text>
              )}

              {/* Capacity */}
              <text
                x={table.positionX + table.width / 2}
                y={table.positionY + table.height / 2 + 25}
                textAnchor="middle"
                fill="#999"
                className="text-xs pointer-events-none select-none"
              >
                {table.capacityMin}-{table.capacityMax}
              </text>
            </g>
          ))}
        </svg>

        {/* Table Details Panel */}
        {selectedTable && !previewMode && (
          <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-64">
            <h4 className="font-bold text-lg mb-2">Table {selectedTable.tableNumber}</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Floor:</strong> {selectedTable.floor}</p>
              <p><strong>Capacity:</strong> {selectedTable.capacityMin}-{selectedTable.capacityMax}</p>
              <p><strong>Position:</strong> ({selectedTable.positionX}, {selectedTable.positionY})</p>
              <p><strong>Size:</strong> {selectedTable.width}x{selectedTable.height}</p>
              <p><strong>Description:</strong> {selectedTable.description}</p>
              <p><strong>Status:</strong>
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  selectedTable.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedTable.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              {selectedTable.isVip && (
                <p className="text-gold font-bold">VIP Table</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleTableEdit(selectedTable)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete table ${selectedTable.tableNumber}?`)) {
                    onTableDelete(selectedTable.id);
                    setSelectedTable(null);
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Edit Table Form */}
        {editingTable && !previewMode && (
          <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-80">
            <h4 className="font-bold text-lg mb-2">Edit Table {editingTable.tableNumber}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingTable.description}
                  onChange={(e) => setEditingTable({...editingTable, description: e.target.value})}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Capacity</label>
                  <input
                    type="number"
                    value={editingTable.capacityMin}
                    onChange={(e) => setEditingTable({...editingTable, capacityMin: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={editingTable.capacityMax}
                    onChange={(e) => setEditingTable({...editingTable, capacityMax: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Width</label>
                  <input
                    type="number"
                    value={editingTable.width}
                    onChange={(e) => setEditingTable({...editingTable, width: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input
                    type="number"
                    value={editingTable.height}
                    onChange={(e) => setEditingTable({...editingTable, height: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTable.isVip}
                    onChange={(e) => setEditingTable({...editingTable, isVip: e.target.checked})}
                  />
                  VIP Table
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTable.isActive}
                    onChange={(e) => setEditingTable({...editingTable, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTableSave}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}