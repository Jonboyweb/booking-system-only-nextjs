'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, Move, Maximize2, ArrowUp, MapPin, Music, Grid3x3, Users, LogOut, Layers, Bath, Square } from 'lucide-react';

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

interface FloorPlanEditorProps {
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  tables: Table[];
  venueObjects: VenueObject[];
  onTableUpdate: (table: Table) => Promise<void>;
  onTableAdd: (table: Partial<Table>) => Promise<void>;
  onTableDelete: (tableId: string) => Promise<void>;
  onVenueObjectUpdate: (object: VenueObject) => Promise<void>;
  onVenueObjectAdd: (object: Partial<VenueObject>) => Promise<void>;
  onVenueObjectDelete: (objectId: string) => Promise<void>;
  onSaveAll: () => Promise<void>;
  previewMode?: boolean;
}

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export default function FloorPlanEditor({
  floor,
  tables,
  venueObjects,
  onTableUpdate,
  onTableAdd,
  onTableDelete,
  onVenueObjectUpdate,
  onVenueObjectAdd,
  onVenueObjectDelete,
  onSaveAll,
  previewMode = false
}: FloorPlanEditorProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [resizingTable, setResizingTable] = useState<Table | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [initialResize, setInitialResize] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editingCapacity, setEditingCapacity] = useState<{ tableId: string, field: 'min' | 'max' } | null>(null);
  const [capacityValue, setCapacityValue] = useState('');

  // Venue object states
  const [selectedObject, setSelectedObject] = useState<VenueObject | null>(null);
  const [draggedObject, setDraggedObject] = useState<VenueObject | null>(null);
  const [resizingObject, setResizingObject] = useState<VenueObject | null>(null);
  const [editingObject, setEditingObject] = useState<VenueObject | null>(null);
  const [showAddObjectForm, setShowAddObjectForm] = useState(false);
  const [newObjectType, setNewObjectType] = useState<VenueObject['type']>('CUSTOM');

  const svgRef = useRef<SVGSVGElement>(null);

  const floorTables = tables.filter(t => t.floor === floor);
  const floorObjects = venueObjects.filter(o => o.floor === floor);

  // Keyboard navigation for both tables and objects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewMode) return;

      const selected = selectedTable || selectedObject;
      if (!selected) return;

      const step = e.shiftKey ? 10 : 1;
      let updated = false;

      if (selectedTable) {
        const updatedTable = { ...selectedTable };

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          updatedTable.positionY = Math.max(0, updatedTable.positionY - step);
          updated = true;
          break;
        case 'ArrowDown':
          e.preventDefault();
          updatedTable.positionY = Math.min(450 - updatedTable.height, updatedTable.positionY + step);
          updated = true;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updatedTable.positionX = Math.max(0, updatedTable.positionX - step);
          updated = true;
          break;
        case 'ArrowRight':
          e.preventDefault();
          updatedTable.positionX = Math.min(650 - updatedTable.width, updatedTable.positionX + step);
          updated = true;
          break;
      }

        if (updated) {
          onTableUpdate(updatedTable);
          setSelectedTable(updatedTable);
          setUnsavedChanges(true);
        }
      } else if (selectedObject) {
        const updatedObject = { ...selectedObject };

        switch(e.key) {
          case 'ArrowUp':
            e.preventDefault();
            updatedObject.positionY = Math.max(0, updatedObject.positionY - step);
            updated = true;
            break;
          case 'ArrowDown':
            e.preventDefault();
            updatedObject.positionY = Math.min(450 - updatedObject.height, updatedObject.positionY + step);
            updated = true;
            break;
          case 'ArrowLeft':
            e.preventDefault();
            updatedObject.positionX = Math.max(0, updatedObject.positionX - step);
            updated = true;
            break;
          case 'ArrowRight':
            e.preventDefault();
            updatedObject.positionX = Math.min(650 - updatedObject.width, updatedObject.positionX + step);
            updated = true;
            break;
        }

        if (updated) {
          onVenueObjectUpdate(updatedObject);
          setSelectedObject(updatedObject);
          setUnsavedChanges(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, selectedObject, onTableUpdate, onVenueObjectUpdate, previewMode]);

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
    setSelectedTable(table);
    e.preventDefault();
  };

  const handleResizeMouseDown = (e: React.MouseEvent, table: Table, handle: ResizeHandle) => {
    if (previewMode) return;
    e.stopPropagation();
    e.preventDefault();

    setResizingTable(table);
    setResizeHandle(handle);
    setInitialResize({
      x: e.clientX,
      y: e.clientY,
      width: table.width,
      height: table.height
    });
    setSelectedTable(table);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 650 / svgRect.width; // SVG viewBox width / actual width

    if (draggedTable) {
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
    } else if (resizingTable && resizeHandle) {
      const deltaX = (e.clientX - initialResize.x) * scale;
      const deltaY = (e.clientY - initialResize.y) * scale;

      let newWidth = initialResize.width;
      let newHeight = initialResize.height;
      let newX = resizingTable.positionX;
      let newY = resizingTable.positionY;

      // Handle resize based on which handle is being dragged
      switch (resizeHandle) {
        case 'e':
          newWidth = Math.max(50, initialResize.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newX = Math.min(resizingTable.positionX + resizingTable.width - 50, resizingTable.positionX + deltaX);
          break;
        case 's':
          newHeight = Math.max(50, initialResize.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(50, initialResize.height - deltaY);
          newY = Math.min(resizingTable.positionY + resizingTable.height - 50, resizingTable.positionY + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(50, initialResize.width + deltaX);
          newHeight = Math.max(50, initialResize.height - deltaY);
          newY = Math.min(resizingTable.positionY + resizingTable.height - 50, resizingTable.positionY + deltaY);
          break;
        case 'nw':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newHeight = Math.max(50, initialResize.height - deltaY);
          newX = Math.min(resizingTable.positionX + resizingTable.width - 50, resizingTable.positionX + deltaX);
          newY = Math.min(resizingTable.positionY + resizingTable.height - 50, resizingTable.positionY + deltaY);
          break;
        case 'se':
          newWidth = Math.max(50, initialResize.width + deltaX);
          newHeight = Math.max(50, initialResize.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newHeight = Math.max(50, initialResize.height + deltaY);
          newX = Math.min(resizingTable.positionX + resizingTable.width - 50, resizingTable.positionX + deltaX);
          break;
      }

      // Ensure table stays within bounds
      newWidth = Math.min(newWidth, 650 - newX);
      newHeight = Math.min(newHeight, 450 - newY);

      const updatedTable = {
        ...resizingTable,
        positionX: Math.round(newX),
        positionY: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      };

      const index = floorTables.findIndex(t => t.id === resizingTable.id);
      if (index !== -1) {
        floorTables[index] = updatedTable;
        setResizingTable(updatedTable);
        setUnsavedChanges(true);
      }
    }
  };

  const handleMouseUp = async () => {
    if (draggedTable) {
      await onTableUpdate(draggedTable);
      setDraggedTable(null);
      setDragOffset({ x: 0, y: 0 });
    }
    if (resizingTable) {
      await onTableUpdate(resizingTable);
      setResizingTable(null);
      setResizeHandle(null);
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

  const getObjectColor = (object: VenueObject) => {
    if (object.color) return object.color;

    switch (object.type) {
      case 'BAR':
        return '#3E2723'; // Dark wood
      case 'DJ_BOOTH':
        return '#424242'; // Dark gray
      case 'DANCE_FLOOR':
        return '#1A237E'; // Dark pattern
      case 'EXIT':
        return '#2E7D32'; // Green
      case 'STAIRCASE':
        return '#5D4037'; // Brown
      case 'TOILETS':
        return '#1565C0'; // Blue
      case 'PARTITION':
        return '#616161'; // Gray semi-transparent
      case 'CUSTOM':
      default:
        return '#757575'; // Neutral gray
    }
  };

  const getObjectIcon = (type: VenueObject['type']) => {
    switch (type) {
      case 'BAR':
        return MapPin;
      case 'DJ_BOOTH':
        return Music;
      case 'PARTITION':
        return Grid3x3;
      case 'DANCE_FLOOR':
        return Users;
      case 'EXIT':
        return LogOut;
      case 'STAIRCASE':
        return Layers;
      case 'TOILETS':
        return Bath;
      case 'CUSTOM':
      default:
        return Square;
    }
  };

  const handleCapacityClick = (e: React.MouseEvent, tableId: string, field: 'min' | 'max', currentValue: number) => {
    e.stopPropagation();
    if (previewMode) return;

    setEditingCapacity({ tableId, field });
    setCapacityValue(currentValue.toString());
  };

  const handleCapacitySave = async () => {
    if (!editingCapacity) return;

    const table = floorTables.find(t => t.id === editingCapacity.tableId);
    if (!table) return;

    const value = parseInt(capacityValue);
    if (isNaN(value) || value < 1 || value > 20) {
      setEditingCapacity(null);
      return;
    }

    const updatedTable = {
      ...table,
      [editingCapacity.field === 'min' ? 'capacityMin' : 'capacityMax']: value
    };

    // Ensure min <= max
    if (updatedTable.capacityMin > updatedTable.capacityMax) {
      if (editingCapacity.field === 'min') {
        updatedTable.capacityMax = updatedTable.capacityMin;
      } else {
        updatedTable.capacityMin = updatedTable.capacityMax;
      }
    }

    await onTableUpdate(updatedTable);
    setEditingCapacity(null);
    setUnsavedChanges(false);
  };

  const renderResizeHandles = (table: Table) => {
    if (selectedTable?.id !== table.id || previewMode) return null;

    const handles: { type: ResizeHandle, cursor: string, x: number, y: number }[] = [
      { type: 'nw', cursor: 'nw-resize', x: table.positionX, y: table.positionY },
      { type: 'n', cursor: 'n-resize', x: table.positionX + table.width / 2, y: table.positionY },
      { type: 'ne', cursor: 'ne-resize', x: table.positionX + table.width, y: table.positionY },
      { type: 'e', cursor: 'e-resize', x: table.positionX + table.width, y: table.positionY + table.height / 2 },
      { type: 'se', cursor: 'se-resize', x: table.positionX + table.width, y: table.positionY + table.height },
      { type: 's', cursor: 's-resize', x: table.positionX + table.width / 2, y: table.positionY + table.height },
      { type: 'sw', cursor: 'sw-resize', x: table.positionX, y: table.positionY + table.height },
      { type: 'w', cursor: 'w-resize', x: table.positionX, y: table.positionY + table.height / 2 }
    ];

    return handles.map(handle => (
      <circle
        key={handle.type}
        cx={handle.x}
        cy={handle.y}
        r="5"
        fill="#FFF"
        stroke="#D4AF37"
        strokeWidth="2"
        style={{ cursor: handle.cursor }}
        onMouseDown={(e) => handleResizeMouseDown(e, table, handle.type)}
      />
    ));
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
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              <Move className="w-4 h-4 inline mr-1" />
              Drag to move
            </span>
            <span>
              <Maximize2 className="w-4 h-4 inline mr-1" />
              Drag handles to resize
            </span>
            <span>
              <ArrowUp className="w-4 h-4 inline mr-1" />
              Arrow keys to move (Shift for 10px)
            </span>
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
                onClick={() => !draggedTable && !resizingTable && setSelectedTable(table)}
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

              {/* Capacity - Inline editable */}
              {editingCapacity?.tableId === table.id ? (
                <foreignObject
                  x={table.positionX + table.width / 2 - 30}
                  y={table.positionY + table.height / 2 + 15}
                  width="60"
                  height="20"
                >
                  <input
                    type="number"
                    value={capacityValue}
                    onChange={(e) => setCapacityValue(e.target.value)}
                    onBlur={handleCapacitySave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCapacitySave();
                      if (e.key === 'Escape') setEditingCapacity(null);
                    }}
                    className="w-full text-center text-xs px-1 py-0 border border-gold rounded"
                    min="1"
                    max="20"
                    autoFocus
                  />
                </foreignObject>
              ) : (
                <g>
                  <rect
                    x={table.positionX + table.width / 2 - 30}
                    y={table.positionY + table.height / 2 + 15}
                    width="60"
                    height="18"
                    fill="transparent"
                    className={previewMode ? '' : 'cursor-pointer hover:fill-black hover:fill-opacity-20'}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <text
                    x={table.positionX + table.width / 2 - 15}
                    y={table.positionY + table.height / 2 + 28}
                    textAnchor="middle"
                    fill="#BBB"
                    className={`text-xs ${previewMode ? 'pointer-events-none' : 'cursor-pointer hover:fill-white'}`}
                    onClick={(e) => handleCapacityClick(e, table.id, 'min', table.capacityMin)}
                  >
                    {table.capacityMin}
                  </text>
                  <text
                    x={table.positionX + table.width / 2}
                    y={table.positionY + table.height / 2 + 28}
                    textAnchor="middle"
                    fill="#999"
                    className="text-xs pointer-events-none"
                  >
                    -
                  </text>
                  <text
                    x={table.positionX + table.width / 2 + 15}
                    y={table.positionY + table.height / 2 + 28}
                    textAnchor="middle"
                    fill="#BBB"
                    className={`text-xs ${previewMode ? 'pointer-events-none' : 'cursor-pointer hover:fill-white'}`}
                    onClick={(e) => handleCapacityClick(e, table.id, 'max', table.capacityMax)}
                  >
                    {table.capacityMax}
                  </text>
                </g>
              )}

              {/* Resize handles */}
              {renderResizeHandles(table)}
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