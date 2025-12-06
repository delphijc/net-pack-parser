import { useState, useMemo } from 'react';
import type { ResourceTiming, LongTask } from '../store/performanceStore';

export type ResourceType = 'all' | 'script' | 'css' | 'img' | 'fetch' | 'other';
export type DomainType = 'all' | 'internal' | 'external';

export const usePerformanceFilter = () => {
  const [resourceType, setResourceType] = useState<ResourceType>('all');
  const [domain, setDomain] = useState<DomainType>('all');
  const [minDuration, setMinDuration] = useState<number>(0);

  const filterResources = useMemo(
    () => (resources: ResourceTiming[]) => {
      return resources.filter((r) => {
        // Resource Type Filter
        const matchesType =
          resourceType === 'all' ||
          (resourceType === 'script' && r.initiatorType === 'script') ||
          (resourceType === 'css' && r.initiatorType === 'css') ||
          (resourceType === 'img' && r.initiatorType === 'img') ||
          (resourceType === 'fetch' &&
            (r.initiatorType === 'fetch' ||
              r.initiatorType === 'xmlhttprequest')) ||
          (resourceType === 'other' &&
            !['script', 'css', 'img', 'fetch', 'xmlhttprequest'].includes(
              r.initiatorType,
            ));

        // Duration Filter
        const matchesDuration = r.duration >= minDuration;

        // Domain Filter
        let matchesDomain = true;
        if (domain !== 'all') {
          try {
            const isInternal =
              r.name.startsWith('/') ||
              new URL(r.name).hostname === window.location.hostname;

            if (domain === 'internal' && !isInternal) matchesDomain = false;
            if (domain === 'external' && isInternal) matchesDomain = false;
          } catch (e) {
            // If URL parsing fails, treat as external unless it starts with /
            if (domain === 'internal' && !r.name.startsWith('/'))
              matchesDomain = false;
          }
        }

        return matchesType && matchesDuration && matchesDomain;
      });
    },
    [resourceType, minDuration, domain],
  );

  const filterLongTasks = useMemo(
    () => (tasks: LongTask[]) => {
      // LongTasks don't strictly have a domain in the same way, usually main thread
      // so we only filter by duration
      return tasks.filter((t) => t.duration >= minDuration);
    },
    [minDuration],
  );

  return {
    resourceType,
    setResourceType,
    domain,
    setDomain,
    minDuration,
    setMinDuration,
    filterResources,
    filterLongTasks,
  };
};
