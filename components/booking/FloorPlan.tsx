'use client';

import { useState } from 'react';
import { Table } from '@/types/booking';

interface FloorPlanProps {
  floor: 'UPSTAIRS' | 'DOWNSTAIRS';
  tables: Table[];
  selectedTable?: Table;
  onTableSelect: (table: Table) => void;
  partySize: number;
  date: string;
  bookedTables?: number[];
}

export default function FloorPlan({
  floor,
  tables,
  selectedTable,
  onTableSelect,
  partySize,
  bookedTables = []
}: FloorPlanProps) {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  
  const floorTables = tables.filter(t => t.floor === floor);
  
  const getTableStatus = (table: Table) => {
    if (bookedTables.includes(table.tableNumber)) return 'booked';
    if (partySize < table.capacityMin || partySize > table.capacityMax) return 'unavailable';
    if (selectedTable?.tableNumber === table.tableNumber) return 'selected';
    return 'available';
  };
  
  const getTableColor = (status: string) => {
    switch (status) {
      case 'booked': return '#722F37'; // Burgundy for booked
      case 'unavailable': return '#666666'; // Gray for unavailable
      case 'selected': return '#D4AF37'; // Gold for selected
      case 'available': return '#2E5F45'; // Green for available
      default: return '#666666';
    }
  };
  
  // Table positions for visual layout (simplified)
  const tablePositions: Record<number, { x: number; y: number; width: number; height: number }> = {
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
        </defs>
        <rect width="650" height="450" fill="#1a1a1a" />
        <rect width="650" height="450" fill="url(#artDeco)" />
        
        {/* Stage/DJ Booth for upstairs */}
        {floor === 'UPSTAIRS' && (
          <>
            <rect x="525" y="0" width="75" height="30" fill="#2a2a2a" stroke="#D4AF37" strokeWidth="2">
              <title>DJ Booth</title>
            </rect>
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
        {floorTables.map(table => {
          const pos = tablePositions[table.tableNumber];
          if (!pos) return null;
          
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
                opacity={status === 'booked' || status === 'unavailable' ? 0.5 : 1}
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
                    'text-gray-400'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </p>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Legend */}
      <div className="flex gap-6 mt-4 justify-center">
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
          <div className="w-4 h-4 bg-gray-600 opacity-50"></div>
          <span className="text-cream text-sm">Unavailable</span>
        </div>
      </div>
    </div>
  );
}