declare module 'cap' {
  export interface CapDevice {
    name: string;
    description?: string;
    addresses: {
      addr?: string;
      netmask?: string;
      broadaddr?: string;
      dstaddr?: string;
    }[];
  }

  export class Cap {
    constructor();
    open(
      device: string,
      filter: string,
      bufSize: number,
      buffer: Buffer,
    ): string;
    close(): void;
    setMinBytes(n: number): void;
    static find(): any;
    static deviceList(): CapDevice[];
    on(
      event: 'packet',
      callback: (nBytes: number, trunc: boolean) => void,
    ): void;
  }

  export const decoders: any;
  export const PROTOCOL: any;
}
