import { Client } from '@elastic/elasticsearch';

export class ElasticService {
  private static instance: ElasticService;
  private client: Client;
  private isConnected: boolean = false;
  private readonly PACKET_INDEX = 'pcap_packets';

  private constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }

  public static getInstance(): ElasticService {
    if (!ElasticService.instance) {
      ElasticService.instance = new ElasticService();
    }
    return ElasticService.instance;
  }

  public async connect(retries = 10, delay = 2000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const health = await this.client.cluster.health();
        console.log('Connected to Elasticsearch:', health.status);
        this.isConnected = true;
        await this.ensureIndices();
        return;
      } catch (error) {
        console.error(`Failed to connect to Elasticsearch (attempt ${i + 1}/${retries}):`, (error as any).message);
        this.isConnected = false;
        if (i < retries - 1) {
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }
    console.error('Max retries reached. Elasticsearch connection failed.');
  }

  private async ensureIndices(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: this.PACKET_INDEX,
    });
    const settings = {
      index: {
        max_result_window: 100000, // Increase limit for large PCAP pagination
      },
    };

    if (!exists) {
      await this.client.indices.create(
        {
          index: this.PACKET_INDEX,
          settings: settings,
          mappings: {
            properties: {
              sessionId: { type: 'keyword' },
              timestamp: { type: 'date' },
              sourceIp: { type: 'ip' },
              destIp: { type: 'ip' },
              protocol: { type: 'keyword' },
              length: { type: 'integer' },
              info: { type: 'text' },
              raw: { type: 'binary' },

              // New fields for extended analysis
              strings: {
                type: 'nested', // Use nested for rich querying later
                properties: {
                  value: { type: 'text' },
                  type: { type: 'keyword' },
                },
              },
              fileReferences: {
                type: 'nested',
                properties: {
                  filename: { type: 'keyword' },
                  mimeType: { type: 'keyword' },
                  size: { type: 'long' },
                },
              },
              threats: {
                type: 'nested',
                properties: {
                  type: { type: 'keyword' },
                  severity: { type: 'keyword' },
                  description: { type: 'text' },
                },
              },
              geoip: {
                properties: {
                  country: { type: 'keyword' }, // Store 2-letter country code
                },
              },
            },
          },
        },
        { ignore: [400] },
      );
      console.log(`Created index: ${this.PACKET_INDEX}`);
    } else {
      // Update settings for existing index
      await this.client.indices.putSettings({
        index: this.PACKET_INDEX,
        body: {
          index: {
            max_result_window: 100000,
          },
        } as any,
      });
      // Try to update mapping if new fields are missing (optional for MVP, might need close/open)
      await this.client.indices
        .putMapping({
          index: this.PACKET_INDEX,
          properties: {
            geoip: {
              properties: {
                country: { type: 'keyword' },
              },
            },
          },
        })
        .catch((e) => console.warn('Mapping update warning:', e.message));

      console.log(`Updated settings for index: ${this.PACKET_INDEX}`);
    }
  }

  public async indexPacket(packet: any): Promise<void> {
    if (!this.isConnected) return; // Or buffer

    try {
      await this.client.index({
        index: this.PACKET_INDEX,
        document: packet,
      });
    } catch (error) {
      console.error('Failed to index packet:', error);
      throw error;
    }
  }

  public async bulkIndexPackets(packets: any[]): Promise<void> {
    if (!this.isConnected || packets.length === 0) return;

    // Fix bulk body structure for Client 8.x/7.x compatibility
    // The new client helper might be better, but sticking to basics:
    const body = packets.flatMap((doc) => [
      { index: { _index: this.PACKET_INDEX } },
      doc,
    ]);

    try {
      const response = await this.client.bulk({ body });
      if (response.errors) {
        console.error('Bulk index had errors');
        const errorItems = response.items
          .map((item) => item.index || item.create)
          .filter((item) => item && item.error);

        if (errorItems.length > 0) {
          console.error(
            'First error sample:',
            JSON.stringify(errorItems[0]?.error, null, 2),
          );
        }
      }
    } catch (error) {
      console.error('Failed to bulk index packets:', error);
    }
  }

  public async searchPackets(
    sessionId: string,
    size: number = 100,
    from: number = 0,
  ): Promise<any> {
    if (!this.isConnected) return { hits: { hits: [], total: { value: 0 } } };

    try {
      const result = await this.client.search({
        index: this.PACKET_INDEX,
        from,
        size,
        query: {
          term: { sessionId: sessionId },
        },
        sort: [{ timestamp: 'asc' }],
      });
      return result.hits;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  public async getDashboardStats(sessionId: string): Promise<any> {
    if (!this.isConnected) return null;

    try {
      const result = await this.client.search({
        index: this.PACKET_INDEX,
        size: 0, // No documents needed, just aggregations
        query: {
          term: { sessionId: sessionId },
        },
        aggs: {
          protocol_distribution: {
            terms: { field: 'protocol', size: 20 },
          },
          traffic_over_time: {
            date_histogram: {
              field: 'timestamp',
              fixed_interval: '1m', // Use fixed_interval for clearer buckets
              min_doc_count: 0,
            },
            aggs: {
              threat_packets: {
                nested: {
                  path: 'threats',
                },
              },
            },
          },
          src_ips: {
            terms: { field: 'sourceIp', size: 10 },
          },
          dest_ips: {
            terms: { field: 'destIp', size: 10 },
          },
          threat_stats: {
            nested: { path: 'threats' },
            aggs: {
              severity_counts: {
                terms: { field: 'threats.severity' },
              },
              type_counts: {
                terms: { field: 'threats.type' },
              },
              details: {
                top_hits: {
                  size: 100, // Fetch up to 100 threat details
                },
              },
            },
          },
          file_stats: {
            nested: { path: 'fileReferences' },
            aggs: {
              count: { value_count: { field: 'fileReferences.filename' } }, // Approximate count of files
            },
          },
          geo_stats: {
            terms: { field: 'geoip.country', size: 50 }, // Aggregate by country code
          },
        },
      });

      // Also fetch recent activity (last 5 packets) separately or in msearch
      // For simplicity, do a separate small query for recent activity
      const recent = await this.client.search({
        index: this.PACKET_INDEX,
        size: 5,
        query: { term: { sessionId: sessionId } },
        sort: [{ timestamp: 'desc' }],
      });

      return {
        totalPackets: (result.hits.total as any).value,
        protocols: (result.aggregations?.protocol_distribution as any).buckets,
        timeline: (result.aggregations?.traffic_over_time as any).buckets,
        topTalkers: {
          src: (result.aggregations?.src_ips as any).buckets,
          dest: (result.aggregations?.dest_ips as any).buckets,
        },
        threats: {
          bySeverity: (result.aggregations?.threat_stats as any).severity_counts
            .buckets,
          byType: (result.aggregations?.threat_stats as any).type_counts
            .buckets,
          total: (result.aggregations?.threat_stats as any).doc_count,
          list: (
            result.aggregations?.threat_stats as any
          ).details.hits.hits.map((h: any) => h._source),
        },
        files: {
          total:
            (result.aggregations?.file_stats as any).count.value ||
            (result.aggregations?.file_stats as any).doc_count,
        },
        geoDistribution: (result.aggregations?.geo_stats as any).buckets,
        recentActivity: recent.hits.hits.map((h: any) => h._source),
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }
}

export const elasticService = ElasticService.getInstance();
