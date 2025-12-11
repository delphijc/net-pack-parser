// @ts-ignore
import countries from 'i18n-iso-countries';
// @ts-ignore
import enLocale from 'i18n-iso-countries/langs/en.json';
import React, { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { ChartWrapper } from './ChartWrapper';
import { Globe } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import type { ParsedPacket } from '../../types';

countries.registerLocale(enLocale);

const GEO_URL = '/world-110m.json';

interface GeoMapProps {
  packets?: ParsedPacket[];
  onFilterClick?: (ip: string, type: 'src' | 'dst') => void;
  geoDistribution?: { key: string; doc_count: number }[];
}

export const GeoMap: React.FC<GeoMapProps> = ({ packets: _packets, onFilterClick: _onFilterClick, geoDistribution }) => {

  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    if (geoDistribution) {
      geoDistribution.forEach(item => {
        // item.key is ISO 2-letter (e.g. US, CN) from geoip-lite
        // Map requires ISO Numeric (e.g. 840, 156) usually
        // Try mapping to Numeric string
        const numericCode = countries.alpha2ToNumeric(item.key);
        if (numericCode) {
          // Remove leading zeros to match some topojson formats if needed, or keep standard
          // usually generic topojson uses integers or strings.
          // i18n returns "840".
          counts[numericCode] = item.doc_count;
          // Also map 2-letter just in case map uses it
          counts[item.key] = item.doc_count;
          // Also map 3-letter
          const alpha3 = countries.alpha2ToAlpha3(item.key);
          if (alpha3) counts[alpha3] = item.doc_count;
        } else {
          counts[item.key] = item.doc_count;
        }
      });
    }
    return counts;
  }, [geoDistribution]);

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(countryData), 0);
  }, [countryData]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxCount || 1])
    .range(['#F5F4F6', '#FF5533']);

  return (
    <ChartWrapper
      title={
        <>
          <Globe size={18} className="mr-2 text-primary" />
          Geographic Distribution
        </>
      }
      actionElement={undefined}
      className="h-full"
      contentClassName="flex-1 min-h-0 relative p-0 overflow-hidden rounded-b-lg"
    >
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147,
        }}
        className="w-full h-full bg-blue-900/10"
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Try multiple properties to find a match
                // Standard world-110m has 'id' (numeric or string) and 'properties.name'
                const id = geo.id;
                const iso2 = geo.properties.ISO_A2 || geo.properties.iso_a2;
                const iso3 = geo.properties.ISO_A3 || geo.properties.iso_a3;
                const name = geo.properties.name || geo.properties.NAME;

                // Create lookups
                // Pad ID to 3 chars if it's a number/short string? "4" -> "004"
                const paddedId = String(id).padStart(3, '0');

                const count =
                  countryData[String(id)] ||
                  countryData[paddedId] ||
                  (iso2 && countryData[iso2]) ||
                  (iso3 && countryData[iso3]) ||
                  0;

                const countryName = name || countries.getName(String(id), "en") || "Unknown";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="geo-tooltip"
                    data-tooltip-content={`${countryName}: ${count} packets`}
                    style={{
                      default: {
                        fill: count > 0 ? colorScale(count) : '#374151',
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
