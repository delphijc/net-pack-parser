import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export class KafkaService {
    private static instance: KafkaService;
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private isConnected: boolean = false;

    private constructor() {
        this.kafka = new Kafka({
            clientId: 'net-pack-parser-server',
            brokers: ['localhost:9094'], // Redpanda mapped port
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: 'pcap-analysis-group' });
    }

    public static getInstance(): KafkaService {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService();
        }
        return KafkaService.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            await this.producer.connect();
            await this.consumer.connect();
            console.log('Successfully connected to Kafka/Redpanda');
            this.isConnected = true;
        } catch (error) {
            console.error('Failed to connect to Kafka:', error);
            // Don't throw, allow retries or app to start without it for dev
        }
    }

    public async produce(topic: string, message: any): Promise<void> {
        if (!this.isConnected) {
            // Try reconnecting?
            await this.connect();
            if (!this.isConnected) {
                throw new Error('Kafka is not connected');
            }
        }

        try {
            await this.producer.send({
                topic,
                messages: [
                    { value: JSON.stringify(message) }
                ],
            });
        } catch (error) {
            console.error(`Failed to produce message to topic ${topic}:`, error);
            throw error;
        }
    }

    public async subscribe(topic: string, handler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
        if (!this.isConnected) {
            await this.connect();
        }

        await this.consumer.subscribe({ topic, fromBeginning: false });

        await this.consumer.run({
            eachMessage: async (payload) => {
                try {
                    await handler(payload);
                } catch (error) {
                    console.error('Error in Kafka consumer handler:', error);
                    // In a real app, handle DLQ (Dead Letter Queue) here
                }
            },
        });
    }

    public async disconnect(): Promise<void> {
        await this.producer.disconnect();
        await this.consumer.disconnect();
        this.isConnected = false;
    }
}

export const kafkaService = KafkaService.getInstance();
