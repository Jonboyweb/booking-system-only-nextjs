'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/types/booking';

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

interface FloorPlanProps {
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  tables: Table[];
  selectedTable?: Table;
  onTableSelect: (table: Table) => void;
  partySize: number;
  date: string;
  bookedTables?: number[];
  blockedTables?: number[];
}

export default function FloorPlanWithObjects({
  floor,
  tables,
  selectedTable,
  onTableSelect,
  partySize,
  bookedTables = [],
  blockedTables = []
}: FloorPlanProps) {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [venueObjects, setVenueObjects] = useState<VenueObject[]>([]);
  const [loading, setLoading] = useState(true);

  const floorTables = tables.filter(t => t.floor === floor);
  const floorObjects = venueObjects.filter(o => o.floor === floor);

  // Fetch venue objects on mount
  useEffect(() => {
    const fetchVenueObjects = async () => {
      try {
        const response = await fetch(`/api/venue-objects?floor=${floor}`);
        if (response.ok) {
          const data = await response.json();
          setVenueObjects(data);
        }
      } catch (error) {
        console.error('Error fetching venue objects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueObjects();
  }, [floor]);

  const getTableStatus = (table: Table) => {
    if (bookedTables.includes(table.tableNumber)) return 'booked';
    if (blockedTables.includes(table.tableNumber)) return 'blocked';
    if (partySize < table.capacityMin || partySize > table.capacityMax) return 'unavailable';
    if (selectedTable?.tableNumber === table.tableNumber) return 'selected';
    return 'available';
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'booked': return '#722F37'; // Burgundy for booked
      case 'blocked': return '#4A0E0E'; // Dark red for blocked
      case 'unavailable': return '#666666'; // Gray for unavailable
      case 'selected': return '#D4AF37'; // Gold for selected
      case 'available': return '#2E5F45'; // Green for available
      default: return '#666666';
    }
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

  // Use positions from database if available
  const getTablePosition = (table: Table): { x: number; y: number; width: number; height: number } => {
    if ('positionX' in table && 'positionY' in table && 'width' in table && 'height' in table) {
      if (table.positionX !== undefined && table.positionY !== undefined &&
          table.width !== undefined && table.height !== undefined) {
        return {
          x: table.positionX,
          y: table.positionY,
          width: table.width,
          height: table.height
        };
      }
    }

    // Fallback positions for backward compatibility
    const fallbackPositions: Record<number, { x: number; y: number; width: number; height: number }> = {
      // Upstairs tables
      10: { x: 50, y: 50, width: 120, height: 80 },
      2: { x: 200, y: 50, width: 100, height: 80 },
      3: { x: 350, y: 50, width: 100, height: 80 },
      4: { x: 500, y: 50, width: 100, height: 80 },
      5: { x: 50, y: 180, width: 100, height: 80 },
      6: { x: 200, y: 180, width: 100, height: 80 },
      7: { x: 350, y: 180, width: 100, height: 80 },
      8: { x: 500, y: 180, width: 100, height: 80 },
      9: { x: 50, y: 310, width: 120, height: 80 },
      1: { x: 450, y: 310, width: 150, height: 100 }, // VIP booth
      // Downstairs tables
      11: { x: 50, y: 50, width: 100, height: 80 },
      12: { x: 200, y: 50, width: 100, height: 80 },
      13: { x: 350, y: 50, width: 100, height: 80 },
      14: { x: 500, y: 50, width: 100, height: 80 },
      15: { x: 100, y: 180, width: 120, height: 80 },
      16: { x: 250, y: 180, width: 120, height: 80 },
    };

    return fallbackPositions[table.tableNumber] || { x: 50, y: 50, width: 100, height: 80 };
  };

  return (
    <div className="relative bg-charcoal p-6 rounded-lg border-2 border-gold">
      <h3 className="text-2xl font-bebas text-gold mb-4">
        {floor === 'UPSTAIRS' ? 'Upstairs - Main Floor' : 'Downstairs - Speakeasy'}
      </h3>

      <svg
        width="650"
        height="450"
        className="w-full h-auto"
        viewBox="0 0 650 450"
      >
        {/* Background pattern */}
        <defs>
          <pattern id="artDeco" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L20 40 M0 20 L40 20" stroke="#2a2a2a" strokeWidth="1" />
          </pattern>
          {/* Pattern for dance floor */}
          <pattern id="danceFloor" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#0D1B4E" />
            <rect x="10" y="0" width="10" height="10" fill="#1A237E" />
            <rect x="0" y="10" width="10" height="10" fill="#1A237E" />
            <rect x="10" y="10" width="10" height="10" fill="#0D1B4E" />
          </pattern>
        </defs>
        <rect width="650" height="450" fill="#1a1a1a" />
        <rect width="650" height="450" fill="url(#artDeco)" />

        {/* Render venue objects first (behind tables) */}
        {floorObjects.map(object => (
          <g key={object.id}>
            <rect
              x={object.positionX}
              y={object.positionY}
              width={object.width}
              height={object.height}
              fill={object.type === 'DANCE_FLOOR' ? 'url(#danceFloor)' : getObjectColor(object)}
              stroke="#333"
              strokeWidth="1"
              opacity={object.type === 'PARTITION' ? 0.5 : 0.8}
            />

            {/* Object label */}
            <text
              x={object.positionX + object.width / 2}
              y={object.positionY + object.height / 2}
              textAnchor="middle"
              fill="#F5F5DC"
              className="font-poiret text-sm pointer-events-none select-none"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontSize: object.width < 80 ? '10px' : '14px'
              }}
            >
              {object.description}
            </text>

            {/* Special icons/indicators for certain types */}
            {object.type === 'EXIT' && (
              <text
                x={object.positionX + object.width / 2}
                y={object.positionY + object.height / 2 + 15}
                textAnchor="middle"
                fill="#4CAF50"
                className="text-xs pointer-events-none select-none"
              >
                ↑ EXIT
              </text>
            )}

            {object.type === 'TOILETS' && (
              <text
                x={object.positionX + object.width / 2}
                y={object.positionY + object.height / 2 + 15}
                textAnchor="middle"
                fill="#90CAF9"
                className="text-xs pointer-events-none select-none"
              >
                🚻
              </text>
            )}

            {object.type === 'DJ_BOOTH' && (
              <text
                x={object.positionX + object.width / 2}
                y={object.positionY + object.height / 2 + 15}
                textAnchor="middle"
                fill="#D4AF37"
                className="text-xs pointer-events-none select-none"
              >
                ♫
              </text>
            )}
          </g>
        ))}

        {/* Render tables */}
        {floorTables.map(table => {
          const pos = getTablePosition(table);
          const status = getTableStatus(table);
          const isHovered = hoveredTable === table.tableNumber;

          return (
            <g key={table.tableNumber}>
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                fill={getTableColor(status)}
                stroke={isHovered ? '#D4AF37' : '#666'}
                strokeWidth={isHovered ? 3 : 1}
                className={status === 'available' ? 'cursor-pointer transition-all' : 'cursor-not-allowed'}
                opacity={status === 'booked' || status === 'unavailable' || status === 'blocked' ? 0.5 : 1}
                onMouseEnter={() => setHoveredTable(table.tableNumber)}
                onMouseLeave={() => setHoveredTable(null)}
                onClick={() => status === 'available' && onTableSelect(table)}
              />

              {/* Table number */}
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + pos.height / 2 - 10}
                textAnchor="middle"
                fill="#F5F5DC"
                className="font-bebas text-lg pointer-events-none"
              >
                {table.tableNumber}
              </text>

              {/* VIP indicator */}
              {table.isVip && (
                <text
                  x={pos.x + pos.width / 2}
                  y={pos.y + pos.height / 2 + 10}
                  textAnchor="middle"
                  fill="#D4AF37"
                  className="font-poiret text-xs pointer-events-none"
                >
                  VIP
                </text>
              )}

              {/* Capacity */}
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + pos.height / 2 + 25}
                textAnchor="middle"
                fill="#999"
                className="text-xs pointer-events-none"
              >
                {table.capacityMin}-{table.capacityMax}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Table info tooltip */}
      {hoveredTable && (
        <div className="absolute bottom-4 left-4 bg-charcoal-light border border-gold p-4 rounded">
          {(() => {
            const table = floorTables.find(t => t.tableNumber === hoveredTable);
            if (!table) return null;
            const status = getTableStatus(table);

            return (
              <>
                <h4 className="font-bebas text-gold text-lg">Table {table.tableNumber}</h4>
                <p className="text-cream text-sm">{table.description}</p>
                <p className="text-cream text-xs mt-1">Capacity: {table.capacityMin}-{table.capacityMax} guests</p>
                {table.features.length > 0 && (
                  <ul className="text-cream text-xs mt-2">
                    {table.features.map((feature, i) => (
                      <li key={i}>• {feature}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs mt-2">
                  Status: <span className={`font-bold ${
                    status === 'available' ? 'text-green-400' :
                    status === 'selected' ? 'text-gold' :
                    status === 'booked' ? 'text-burgundy' :
                    status === 'blocked' ? 'text-red-500' :
                    'text-gray-400'
                  }`}>
                    {status === 'blocked' ? 'BLOCKED/MAINTENANCE' : status.toUpperCase()}
                  </span>
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-4 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#2E5F45]"></div>
          <span className="text-cream text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gold"></div>
          <span className="text-cream text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-burgundy opacity-50"></div>
          <span className="text-cream text-sm">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#4A0E0E] opacity-50"></div>
          <span className="text-cream text-sm">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 opacity-50"></div>
          <span className="text-cream text-sm">Unavailable</span>
        </div>
      </div>
    </div>
  );
}