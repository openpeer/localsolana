import { ParsedCacheEntry } from '@/types/cache';
import { formatTimeLeft, getStatusColor } from './utils/index';
import { useMemo } from 'react';

interface PriceGridProps {
  entries: ParsedCacheEntry[];
}

const getStatusIndicator = (timeLeft: number) => {
  const color = getStatusColor(timeLeft);
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`}>●</span>;
};

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
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2">Token</th>
              <th className="px-4 py-2">Currency</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Time Left</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={`${entry.token}-${entry.currency}-${entry.type}-${index}`}>
                <td className="border px-4 py-2">{entry.token.toUpperCase()}</td>
                <td className="border px-4 py-2">
                  {entry.type ? `${entry.currency.toUpperCase()} ${entry.type}` : entry.currency.toUpperCase()}
                </td>
                <td className="border px-4 py-2">{entry.formattedValue}</td>
                <td className="border px-4 py-2">
                  {formatTimeLeft(entry.timeLeft)}
                </td>
                <td className="border px-4 py-2">
                  {getStatusIndicator(entry.timeLeft)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};