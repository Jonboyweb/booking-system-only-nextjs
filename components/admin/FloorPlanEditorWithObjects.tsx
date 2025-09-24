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
type DraggedItem = { type: 'table'; item: Table } | { type: 'object'; item: VenueObject };
type SelectedItem = { type: 'table'; item: Table } | { type: 'object'; item: VenueObject };

export default function FloorPlanEditorWithObjects({
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
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState<DraggedItem | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [initialResize, setInitialResize] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editingObject, setEditingObject] = useState<VenueObject | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddObjectForm, setShowAddObjectForm] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<{ tableId: string, field: 'min' | 'max' } | null>(null);
  const [capacityValue, setCapacityValue] = useState('');
  const [newObjectType, setNewObjectType] = useState<VenueObject['type']>('CUSTOM');
  const svgRef = useRef<SVGSVGElement>(null);

  const floorTables = tables.filter(t => t.floor === floor);
  const floorObjects = venueObjects.filter(o => o.floor === floor);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem || previewMode) return;

      const step = e.shiftKey ? 10 : 1;
      let updated = false;

      if (selectedItem.type === 'table') {
        const updatedTable = { ...selectedItem.item };

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
          setSelectedItem({ type: 'table', item: updatedTable });
          setUnsavedChanges(true);
        }
      } else if (selectedItem.type === 'object') {
        const updatedObject = { ...selectedItem.item };

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
          setSelectedItem({ type: 'object', item: updatedObject });
          setUnsavedChanges(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, onTableUpdate, onVenueObjectUpdate, previewMode]);

  const handleMouseDown = (e: React.MouseEvent<SVGElement>, item: Table | VenueObject, itemType: 'table' | 'object') => {
    if (previewMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    setDraggedItem({ type: itemType, item } as DraggedItem);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectedItem({ type: itemType, item } as SelectedItem);
    e.preventDefault();
  };

  const handleResizeMouseDown = (e: React.MouseEvent, item: Table | VenueObject, itemType: 'table' | 'object', handle: ResizeHandle) => {
    if (previewMode) return;
    e.stopPropagation();
    e.preventDefault();

    setResizingItem({ type: itemType, item } as DraggedItem);
    setResizeHandle(handle);
    setInitialResize({
      x: e.clientX,
      y: e.clientY,
      width: 'width' in item ? item.width : 100,
      height: 'height' in item ? item.height : 80
    });
    setSelectedItem({ type: itemType, item } as SelectedItem);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scale = 650 / svgRect.width;

    if (draggedItem) {
      const newX = Math.max(0, Math.min(650 - draggedItem.item.width,
        (e.clientX - svgRect.left - dragOffset.x) * scale));
      const newY = Math.max(0, Math.min(450 - draggedItem.item.height,
        (e.clientY - svgRect.top - dragOffset.y) * scale));

      if (draggedItem.type === 'table') {
        const updated: Table = {
          ...draggedItem.item,
          positionX: Math.round(newX),
          positionY: Math.round(newY)
        };
        setDraggedItem({ type: 'table', item: updated });
      } else {
        const updated: VenueObject = {
          ...draggedItem.item,
          positionX: Math.round(newX),
          positionY: Math.round(newY)
        };
        setDraggedItem({ type: 'object', item: updated });
      }
      setUnsavedChanges(true);
    } else if (resizingItem && resizeHandle) {
      const deltaX = (e.clientX - initialResize.x) * scale;
      const deltaY = (e.clientY - initialResize.y) * scale;

      let newWidth = initialResize.width;
      let newHeight = initialResize.height;
      let newX = resizingItem.item.positionX;
      let newY = resizingItem.item.positionY;

      switch (resizeHandle) {
        case 'e':
          newWidth = Math.max(50, initialResize.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newX = Math.min(resizingItem.item.positionX + resizingItem.item.width - 50, resizingItem.item.positionX + deltaX);
          break;
        case 's':
          newHeight = Math.max(50, initialResize.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(50, initialResize.height - deltaY);
          newY = Math.min(resizingItem.item.positionY + resizingItem.item.height - 50, resizingItem.item.positionY + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(50, initialResize.width + deltaX);
          newHeight = Math.max(50, initialResize.height - deltaY);
          newY = Math.min(resizingItem.item.positionY + resizingItem.item.height - 50, resizingItem.item.positionY + deltaY);
          break;
        case 'nw':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newHeight = Math.max(50, initialResize.height - deltaY);
          newX = Math.min(resizingItem.item.positionX + resizingItem.item.width - 50, resizingItem.item.positionX + deltaX);
          newY = Math.min(resizingItem.item.positionY + resizingItem.item.height - 50, resizingItem.item.positionY + deltaY);
          break;
        case 'se':
          newWidth = Math.max(50, initialResize.width + deltaX);
          newHeight = Math.max(50, initialResize.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(50, initialResize.width - deltaX);
          newHeight = Math.max(50, initialResize.height + deltaY);
          newX = Math.min(resizingItem.item.positionX + resizingItem.item.width - 50, resizingItem.item.positionX + deltaX);
          break;
      }

      newWidth = Math.min(newWidth, 650 - newX);
      newHeight = Math.min(newHeight, 450 - newY);

      if (resizingItem.type === 'table') {
        const updated: Table = {
          ...resizingItem.item,
          positionX: Math.round(newX),
          positionY: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        };
        setResizingItem({ type: 'table', item: updated });
      } else {
        const updated: VenueObject = {
          ...resizingItem.item,
          positionX: Math.round(newX),
          positionY: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        };
        setResizingItem({ type: 'object', item: updated });
      }
      setUnsavedChanges(true);
    }
  };

  const handleMouseUp = async () => {
    if (draggedItem) {
      if (draggedItem.type === 'table') {
        await onTableUpdate(draggedItem.item as Table);
      } else {
        await onVenueObjectUpdate(draggedItem.item as VenueObject);
      }
      setDraggedItem(null);
      setDragOffset({ x: 0, y: 0 });
    }
    if (resizingItem) {
      if (resizingItem.type === 'table') {
        await onTableUpdate(resizingItem.item as Table);
      } else {
        await onVenueObjectUpdate(resizingItem.item as VenueObject);
      }
      setResizingItem(null);
      setResizeHandle(null);
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

  const handleAddObject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newObject: Partial<VenueObject> = {
      type: newObjectType,
      description: formData.get('description') as string,
      floor: floor,
      positionX: 350,
      positionY: 250,
      width: newObjectType === 'BAR' ? 150 : newObjectType === 'DANCE_FLOOR' ? 200 : 100,
      height: newObjectType === 'BAR' ? 60 : newObjectType === 'DANCE_FLOOR' ? 150 : 80,
      color: formData.get('color') as string || undefined
    };

    await onVenueObjectAdd(newObject);
    setShowAddObjectForm(false);
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
        return '#3E2723';
      case 'DJ_BOOTH':
        return '#424242';
      case 'DANCE_FLOOR':
        return '#1A237E';
      case 'EXIT':
        return '#2E7D32';
      case 'STAIRCASE':
        return '#5D4037';
      case 'TOILETS':
        return '#1565C0';
      case 'PARTITION':
        return '#616161';
      case 'CUSTOM':
      default:
        return '#757575';
    }
  };

  const renderResizeHandles = (item: Table | VenueObject, itemType: 'table' | 'object') => {
    const isSelected = selectedItem && selectedItem.type === itemType && selectedItem.item.id === item.id;
    if (!isSelected || previewMode) return null;

    const handles: { type: ResizeHandle, cursor: string, x: number, y: number }[] = [
      { type: 'nw', cursor: 'nw-resize', x: item.positionX, y: item.positionY },
      { type: 'n', cursor: 'n-resize', x: item.positionX + item.width / 2, y: item.positionY },
      { type: 'ne', cursor: 'ne-resize', x: item.positionX + item.width, y: item.positionY },
      { type: 'e', cursor: 'e-resize', x: item.positionX + item.width, y: item.positionY + item.height / 2 },
      { type: 'se', cursor: 'se-resize', x: item.positionX + item.width, y: item.positionY + item.height },
      { type: 's', cursor: 's-resize', x: item.positionX + item.width / 2, y: item.positionY + item.height },
      { type: 'sw', cursor: 'sw-resize', x: item.positionX, y: item.positionY + item.height },
      { type: 'w', cursor: 'w-resize', x: item.positionX, y: item.positionY + item.height / 2 }
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
        onMouseDown={(e) => handleResizeMouseDown(e, item, itemType, handle.type)}
      />
    ));
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

  const objectTypeOptions: { value: VenueObject['type']; label: string; icon: any }[] = [
    { value: 'BAR', label: 'Bar', icon: MapPin },
    { value: 'DJ_BOOTH', label: 'DJ Booth', icon: Music },
    { value: 'PARTITION', label: 'Partition', icon: Grid3x3 },
    { value: 'DANCE_FLOOR', label: 'Dance Floor', icon: Users },
    { value: 'EXIT', label: 'Exit', icon: LogOut },
    { value: 'STAIRCASE', label: 'Staircase', icon: Layers },
    { value: 'TOILETS', label: 'Toilets', icon: Bath },
    { value: 'CUSTOM', label: 'Custom', icon: Square }
  ];

  // Get the appropriate displayed items with dragged/resizing state
  const displayedTables = floorTables.map(table => {
    if (draggedItem?.type === 'table' && draggedItem.item.id === table.id) {
      return draggedItem.item as Table;
    }
    if (resizingItem?.type === 'table' && resizingItem.item.id === table.id) {
      return resizingItem.item as Table;
    }
    return table;
  });

  const displayedObjects = floorObjects.map(object => {
    if (draggedItem?.type === 'object' && draggedItem.item.id === object.id) {
      return draggedItem.item as VenueObject;
    }
    if (resizingItem?.type === 'object' && resizingItem.item.id === object.id) {
      return resizingItem.item as VenueObject;
    }
    return object;
  });

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
            <button
              onClick={() => setShowAddObjectForm(!showAddObjectForm)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Venue Object
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
            <input name="tableNumber" type="number" placeholder="Table Number" className="px-3 py-2 border rounded" required />
            <input name="description" type="text" placeholder="Description" className="px-3 py-2 border rounded" required />
            <input name="capacityMin" type="number" placeholder="Min Capacity" className="px-3 py-2 border rounded" required />
            <input name="capacityMax" type="number" placeholder="Max Capacity" className="px-3 py-2 border rounded" required />
            <input name="features" type="text" placeholder="Features (comma separated)" className="px-3 py-2 border rounded col-span-2" />
            <label className="flex items-center gap-2">
              <input name="isVip" type="checkbox" />
              VIP Table
            </label>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Venue Object Form */}
      {showAddObjectForm && !previewMode && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-2">Add New Venue Object</h3>
          <form onSubmit={handleAddObject} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {objectTypeOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewObjectType(option.value)}
                      className={`p-2 border rounded flex flex-col items-center gap-1 ${
                        newObjectType === option.value ? 'bg-purple-100 border-purple-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <input name="description" type="text" placeholder="Description/Label" className="w-full px-3 py-2 border rounded" required />
            <input name="color" type="color" placeholder="Custom Color (optional)" className="px-3 py-2 border rounded" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Add</button>
              <button type="button" onClick={() => setShowAddObjectForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
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

          {/* Render venue objects first (behind tables) */}
          {displayedObjects.map(object => (
            <g key={object.id}>
              <rect
                x={object.positionX}
                y={object.positionY}
                width={object.width}
                height={object.height}
                fill={getObjectColor(object)}
                stroke={selectedItem?.type === 'object' && selectedItem.item.id === object.id ? '#FFF' : '#666'}
                strokeWidth={selectedItem?.type === 'object' && selectedItem.item.id === object.id ? 3 : 1}
                opacity={object.type === 'PARTITION' ? 0.7 : 0.9}
                className={previewMode ? '' : 'cursor-move hover:stroke-2'}
                onMouseDown={(e) => handleMouseDown(e, object, 'object')}
                onClick={() => !draggedItem && !resizingItem && setSelectedItem({ type: 'object', item: object })}
              />

              {/* Object label */}
              <text
                x={object.positionX + object.width / 2}
                y={object.positionY + object.height / 2}
                textAnchor="middle"
                fill="#F5F5DC"
                className="font-poiret text-sm pointer-events-none select-none"
              >
                {object.description}
              </text>

              {/* Type indicator for custom objects */}
              {object.type === 'CUSTOM' && (
                <text
                  x={object.positionX + object.width / 2}
                  y={object.positionY + object.height / 2 + 15}
                  textAnchor="middle"
                  fill="#999"
                  className="font-poiret text-xs pointer-events-none select-none"
                >
                  {object.type}
                </text>
              )}

              {/* Resize handles */}
              {renderResizeHandles(object, 'object')}
            </g>
          ))}

          {/* Render tables */}
          {displayedTables.map(table => (
            <g key={table.id}>
              <rect
                x={table.positionX}
                y={table.positionY}
                width={table.width}
                height={table.height}
                fill={getTableColor(table)}
                stroke={selectedItem?.type === 'table' && selectedItem.item.id === table.id ? '#FFF' : '#666'}
                strokeWidth={selectedItem?.type === 'table' && selectedItem.item.id === table.id ? 3 : 1}
                opacity={table.isActive ? 1 : 0.5}
                className={previewMode ? '' : 'cursor-move hover:stroke-2'}
                onMouseDown={(e) => handleMouseDown(e, table, 'table')}
                onClick={() => !draggedItem && !resizingItem && setSelectedItem({ type: 'table', item: table })}
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
              {renderResizeHandles(table, 'table')}
            </g>
          ))}
        </svg>

        {/* Selected Item Details Panel */}
        {selectedItem && !previewMode && (
          <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-64">
            {selectedItem.type === 'table' ? (
              <>
                <h4 className="font-bold text-lg mb-2">Table {selectedItem.item.tableNumber}</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Floor:</strong> {selectedItem.item.floor}</p>
                  <p><strong>Capacity:</strong> {selectedItem.item.capacityMin}-{selectedItem.item.capacityMax}</p>
                  <p><strong>Position:</strong> ({selectedItem.item.positionX}, {selectedItem.item.positionY})</p>
                  <p><strong>Size:</strong> {selectedItem.item.width}x{selectedItem.item.height}</p>
                  <p><strong>Description:</strong> {selectedItem.item.description}</p>
                  <p><strong>Status:</strong>
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedItem.item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedItem.item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  {selectedItem.item.isVip && (
                    <p className="text-gold font-bold">VIP Table</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditingTable({ ...selectedItem.item })}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete table ${selectedItem.item.tableNumber}?`)) {
                        onTableDelete(selectedItem.item.id);
                        setSelectedItem(null);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-bold text-lg mb-2">{selectedItem.item.description}</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {selectedItem.item.type.replace('_', ' ')}</p>
                  <p><strong>Floor:</strong> {selectedItem.item.floor}</p>
                  <p><strong>Position:</strong> ({selectedItem.item.positionX}, {selectedItem.item.positionY})</p>
                  <p><strong>Size:</strong> {selectedItem.item.width}x{selectedItem.item.height}</p>
                  {selectedItem.item.color && (
                    <p><strong>Color:</strong>
                      <span className="inline-block ml-2 w-6 h-6 rounded border" style={{ backgroundColor: selectedItem.item.color }}></span>
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditingObject({ ...selectedItem.item })}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${selectedItem.item.description}?`)) {
                        onVenueObjectDelete(selectedItem.item.id);
                        setSelectedItem(null);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </>
            )}
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
                  onClick={async () => {
                    await onTableUpdate(editingTable);
                    setEditingTable(null);
                    setUnsavedChanges(false);
                  }}
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

        {/* Edit Venue Object Form */}
        {editingObject && !previewMode && (
          <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-80">
            <h4 className="font-bold text-lg mb-2">Edit {editingObject.description}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingObject.description}
                  onChange={(e) => setEditingObject({...editingObject, description: e.target.value})}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editingObject.type}
                  onChange={(e) => setEditingObject({...editingObject, type: e.target.value as VenueObject['type']})}
                  className="w-full px-3 py-1 border rounded"
                >
                  {objectTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Width</label>
                  <input
                    type="number"
                    value={editingObject.width}
                    onChange={(e) => setEditingObject({...editingObject, width: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input
                    type="number"
                    value={editingObject.height}
                    onChange={(e) => setEditingObject({...editingObject, height: parseInt(e.target.value)})}
                    className="w-full px-3 py-1 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color (optional)</label>
                <input
                  type="color"
                  value={editingObject.color || '#757575'}
                  onChange={(e) => setEditingObject({...editingObject, color: e.target.value})}
                  className="w-full px-3 py-1 border rounded h-10"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await onVenueObjectUpdate(editingObject);
                    setEditingObject(null);
                    setUnsavedChanges(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingObject(null)}
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