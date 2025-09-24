'use client';

import { useEffect, useState } from 'react';
import { Trash2, Calendar, Info } from 'lucide-react';

interface TableBlock {
  id: string;
  tableId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  blockedBy: string;
  createdAt: string;
  table: {
    tableNumber: number;
    floor: string;
  };
}

interface TableBlocksListProps {
  refreshTrigger?: number;
}

export default function TableBlocksList({ refreshTrigger }: TableBlocksListProps) {
  const [blocks, setBlocks] = useState<TableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, [refreshTrigger]);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/admin/table-blocks');
      const data = await response.json();
      if (data.success) {
        setBlocks(data.data);
      }
    } catch (error) {
      console.error('Error fetching table blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this table block?')) {
      return;
    }

    setDeletingId(blockId);
    try {
      const response = await fetch(`/api/admin/table-blocks/${blockId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchBlocks();
      }
    } catch (error) {
      console.error('Error deleting table block:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isActive = (block: TableBlock) => {
    const now = new Date();
    const start = new Date(block.startDate);
    const end = new Date(block.endDate);
    return now >= start && now <= end;
  };

  const isPast = (block: TableBlock) => {
    return new Date(block.endDate) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading table blocks...</div>;
  }

  if (blocks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No table blocks configured</p>
          <p className="text-sm mt-1">Block tables on specific dates to prevent bookings</p>
        </div>
      </div>
    );
  }

  // Sort blocks: active first, then future, then past
  const sortedBlocks = [...blocks].sort((a, b) => {
    if (isActive(a) && !isActive(b)) return -1;
    if (!isActive(a) && isActive(b)) return 1;
    if (isPast(a) && !isPast(b)) return 1;
    if (!isPast(a) && isPast(b)) return -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Date-Specific Table Blocks</h3>
        <p className="text-sm text-gray-600 mt-1">
          Tables blocked on specific dates ({blocks.length} total)
        </p>
      </div>

      <div className="divide-y">
        {sortedBlocks.map((block) => {
          const active = isActive(block);
          const past = isPast(block);

          return (
            <div
              key={block.id}
              className={`px-6 py-4 ${past ? 'bg-gray-50 opacity-60' : ''} ${active ? 'bg-amber-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">
                      Table {block.table.tableNumber}
                    </h4>
                    <span className="text-sm text-gray-600">
                      ({block.table.floor})
                    </span>
                    {active && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                        Currently Blocked
                      </span>
                    )}
                    {past && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Past
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(block.startDate)} - {formatDate(block.endDate)}
                      </span>
                    </div>
                  </div>

                  {block.reason && (
                    <div className="mt-2 flex items-start gap-1">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">{block.reason}</p>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    Blocked by {block.blockedBy} on {formatDate(block.createdAt)}
                  </div>
                </div>

                {!past && (
                  <button
                    onClick={() => handleDelete(block.id)}
                    disabled={deletingId === block.id}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}