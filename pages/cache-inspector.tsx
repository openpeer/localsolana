import { useEffect, useState } from 'react';
import { Tab } from '@headlessui/react';
import { CacheResponse, ParsedCacheEntry } from '../types/cache';
import { minkeApi } from '@/pages/api/utils/utils';
import { PriceGrid } from '@/components/CacheInspector/PriceGrid';

export default function CacheInspector() {
  const [cacheData, setCacheData] = useState<ParsedCacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<string>('all');

  const fetchCacheData = async () => {
    try {
      const response = await minkeApi.get<CacheResponse>('/api/prices/cache/inspect');
      const parsed = Object.entries(response.data.data).map(([key, data]) => {
        const [, token, currency, type] = key.split('/');
        const isBinance = !key.includes('prices/') || type;
        
        // Ensure value is correctly typed based on source
        const value = isBinance && Array.isArray(data.value) 
          ? data.value as [number, number, number] 
          : data.value as number;

        return {
          token: token.toLowerCase(),
          currency: currency.toLowerCase(),
          type: type as 'BUY' | 'SELL' | undefined,
          value,
          timeLeft: data.timeLeft,
          source: isBinance ? 'binance' : 'coingecko'
        } satisfies ParsedCacheEntry;
      });
      setCacheData(parsed);
    } catch (error) {
      console.error('Failed to fetch cache data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheData();
    const interval = setInterval(fetchCacheData, 60000);
    return () => clearInterval(interval);
  }, []);

  const uniqueTokens = Array.from(new Set(cacheData.map(entry => entry.token)));
  
  const filteredData = selectedToken === 'all' 
    ? cacheData 
    : cacheData.filter(entry => entry.token === selectedToken);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Price Cache Inspector</h1>
      
      <div className="mb-4">
        <select 
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Tokens</option>
          {uniqueTokens.map(token => (
            <option key={token} value={token}>{token.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>
            CoinGecko Prices
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
             ${selected ? 'bg-white shadow text-blue-700' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
          }>
            Binance Prices
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <PriceGrid 
              entries={filteredData.filter(entry => entry.source === 'coingecko')} 
            />
          </Tab.Panel>
          <Tab.Panel>
            <PriceGrid 
              entries={filteredData.filter(entry => entry.source === 'binance')} 
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}