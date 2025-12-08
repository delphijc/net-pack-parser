import React, { useEffect, useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { ChartWrapper } from './ChartWrapper';
import { Globe, RefreshCw } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import type { ParsedPacket } from '../../types';
import { geoIpService } from '../../services/GeoIpService';

const GEO_URL = '/world-110m.json';

interface GeoMapProps {
  packets: ParsedPacket[];
  onFilterClick?: (ip: string, type: 'src' | 'dst') => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GeoMap: React.FC<GeoMapProps> = ({ packets, onFilterClick: _onFilterClick }) => {
  const [countryData, setCountryData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const processGeoData = async () => {
      setLoading(true);
      const counts: Record<string, number> = {};

      // Aggregate counts per IP first to avoid re-resolving same IP
      // Actually we want connection counts or data volume?
      // "Map IP addresses... visualize physical origin and destination"
      // Let's map Source IPs for now, or both?
      // AC says "IP activity".

      const ipActivity: Record<string, number> = {};
      packets.forEach((p) => {
        ipActivity[p.sourceIP] = (ipActivity[p.sourceIP] || 0) + 1;
        // ipActivity[p.destIP] = (ipActivity[p.destIP] || 0) + 1; // Double counting?
        // Let's stick to Source IP for "Origin" visualization mostly, or maybe distinct IPs.
      });

      const uniqueIps = Object.keys(ipActivity);

      for (const ip of uniqueIps) {
        if (!mounted) break;
        const location = await geoIpService.resolve(ip);
        if (
          location &&
          location.countryCode !== 'LOCAL' &&
          location.countryCode
        ) {
          // react-simple-maps usually uses ISO-3 alpha codes in the standard topology
          // But our mock service returns ISO-2.
          // We might need a mapping or just map by Name if topology supports it.
          // The world-atlas 110m usually has valid ISO numeric IDs or properties.
          // We'll rely on property matching (NAME or ISO_A2/A3).
          // Let's assume we map by ISO-2 if available or convert.
          // For MVP, simplistic mapping by ISO-2 alias if the map has it.

          // Actually, standard world-110m topology properties usually include "name" and "iso_a2".
          const k = location.countryCode;
          counts[k] = (counts[k] || 0) + ipActivity[ip];
        }
      }

      if (mounted) {
        setCountryData(counts);
        setLoading(false);
      }
    };

    processGeoData();
    return () => {
      mounted = false;
    };
  }, [packets]);

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(countryData), 0);
  }, [countryData]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount || 1])
    .range(['#F5F4F6', '#FF5533']); // Light to Intense Red? Or Theme colors.
  // Dark mode:
  // range: ['#2D3748', '#FC8181']

  return (
    <ChartWrapper
      title={
        <>
          <Globe size={18} className="mr-2 text-primary" />
          Geographic Distribution
        </>
      }
      actionElement={
        loading ? (
          <RefreshCw size={14} className="animate-spin text-muted-foreground" />
        ) : undefined
      }
      className="h-full"
      contentClassName="flex-1 min-h-0 relative p-0 overflow-hidden rounded-b-lg"
    >
      <ComposableMap
        projectionConfig={{
          rotate: [0, 0, 0],
          scale: 147,
        }}
        className="w-full h-full bg-blue-900/10" // Ocean color hint
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // geo.properties.ISO_A2 might exist
                const countryCode =
                  geo.properties.ISO_A2 || geo.properties.iso_a2;
                const count = countryData[countryCode] || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="geo-tooltip"
                    data-tooltip-content={`${geo.properties.name}: ${count} packets`}
                    style={{
                      default: {
                        fill: count > 0 ? colorScale(count) : '#374151', // Gray-700
                        outline: 'none',
                        stroke: '#4B5563',
                        strokeWidth: 0.5,
                      },
                      hover: {
                        fill: '#F53',
                        outline: 'none',
                      },
                      pressed: {
                        fill: '#E42',
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <Tooltip id="geo-tooltip" />
    </ChartWrapper>
  );
};
