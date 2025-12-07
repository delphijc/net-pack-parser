export interface GeoLocation {
  country: string;
  countryCode: string; // ISO 2-letter
  city?: string;
  lat?: number;
  lon?: number;
  isLocal?: boolean;
}

class GeoIpService {
  private cache: Map<string, GeoLocation> = new Map();

  // Mock database for demo purposes
  private mockDb: Record<string, GeoLocation> = {
    '8.8.8.8': {
      country: 'United States',
      countryCode: 'US',
      city: 'Mountain View',
      lat: 37.386,
      lon: -122.0838,
    },
    '8.8.4.4': {
      country: 'United States',
      countryCode: 'US',
      city: 'Mountain View',
      lat: 37.386,
      lon: -122.0838,
    },
    '1.1.1.1': {
      country: 'Australia',
      countryCode: 'AU',
      city: 'Brisbane',
      lat: -27.47,
      lon: 153.02,
    },
    '208.67.222.222': {
      country: 'United States',
      countryCode: 'US',
      city: 'San Francisco',
      lat: 37.77,
      lon: -122.41,
    },
    '142.250.180.14': {
      country: 'United States',
      countryCode: 'US',
      lat: 37.386,
      lon: -122.0838,
    }, // Google
    '104.21.72.176': {
      country: 'United States',
      countryCode: 'US',
      lat: 37.77,
      lon: -122.41,
    }, // Cloudflare
  };

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0 - 127.255.255.255
    if (parts[0] === 127) return true;

    return false;
  }

  public async resolve(ip: string): Promise<GeoLocation | null> {
    if (this.cache.has(ip)) {
      return this.cache.get(ip)!;
    }

    if (this.isPrivateIp(ip)) {
      const result: GeoLocation = {
        country: 'Local Network',
        countryCode: 'LOCAL',
        isLocal: true,
      };
      this.cache.set(ip, result);
      return result;
    }

    // Check mock DB
    if (this.mockDb[ip]) {
      const result = this.mockDb[ip];
      this.cache.set(ip, result);
      return result;
    }

    // Simulated "Unknown" or randomized for demo consistency if not in mock DB
    // For a real demo feel, we could hash the IP to a country list, but that's misleading.
    // Let's return null for unknown public IPs for now, or maybe map to "Unknown".

    return null;
  }
}

export const geoIpService = new GeoIpService();
