import { ParsedCacheEntry } from '@/types/cache';
import { formatTimeLeft, getStatusColor } from './utils/index';
import { useMemo } from 'react';

interface PriceGridProps {
  entries: ParsedCacheEntry[];
}

export const PriceGrid = ({ entries }: PriceGridProps) => {
  const stats = useMemo(() => ({
    totalEntries: entries.length,
    averageTimeLeft: entries.reduce((acc, entry) => acc + entry.timeLeft, 0) / entries.length,
    entriesPerToken: Object.entries(
      entries.reduce((acc, entry) => {
        acc[entry.token] = (acc[entry.token] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
  }), [entries]);

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Cache Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">Total Entries:</span>
            <span className="ml-2 font-medium">{stats.totalEntries}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Time Left:</span>
            <span className="ml-2 font-medium">{formatTimeLeft(stats.averageTimeLeft)}</span>
          </div>
          <div>
            <span className="text-gray-600">Entries per Token:</span>
            <div className="text-sm">
              {stats.entriesPerToken.map(([token, count]) => (
                <div key={token}>
                  {token.toUpperCase()}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry, index) => (
              <tr key={`${entry.token}-${entry.currency}-${entry.type}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.token.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.currency.toUpperCase()}
                  {entry.type && ` (${entry.type})`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Array.isArray(entry.value) 
                    ? `${entry.value[0]} | ${entry.value[1]} | ${entry.value[2]}`
                    : entry.value.toFixed(6)
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimeLeft(entry.timeLeft)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.timeLeft)}`}>
                    ●
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};