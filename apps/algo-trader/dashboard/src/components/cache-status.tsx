/**
 * Build Cache Status Indicator
 * Displays cache hit/miss status, hit rate, and local cache size
 */
import { useState, useEffect } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  localSize: number;
  tier: 'local' | 'raas' | 'miss';
}

export function CacheStatus() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch cache stats from API
    fetch('/api/cache/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock data if API not available
        setStats({
          hits: 0,
          misses: 0,
          hitRate: 0,
          localSize: 0,
          tier: 'miss',
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-64 bg-bg-card border border-bg-border rounded-lg">
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const hitRatePercent = (stats.hitRate * 100).toFixed(0);
  const sizeMB = (stats.localSize / 1024 / 1024).toFixed(1);

  return (
    <div className="w-64 bg-bg-card border border-bg-border rounded-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Build Cache</span>
          <div
            className={
              stats.hitRate > 0.5
                ? 'px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border-green-500/40'
                : 'px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
            }
          >
            {stats.tier === 'local' || stats.tier === 'raas' ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                HIT
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                MISS
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Hit Rate:</span>
            <span className="font-mono">{hitRatePercent}%</span>
          </div>
          <div className="flex justify-between">
            <span>Cache Size:</span>
            <span className="font-mono">{sizeMB} MB</span>
          </div>
          <div className="flex justify-between">
            <span>Hits/Misses:</span>
            <span className="font-mono">
              {stats.hits}/{stats.misses}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
