// client/src/utils/bpfTypes.ts

export type BpfTokenType =
  | 'KEYWORD' // tcp, udp, icmp, host, net, port, src, dst, and, or, not
  | 'NUMBER'
  | 'IP_ADDRESS'
  | 'CIDR_BLOCK'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOS' // End of string
  | 'UNKNOWN';

export interface BpfToken {
  type: BpfTokenType;
  value: string;
}

export type BpfExpression =
  | { type: 'protocol'; value: 'tcp' | 'udp' | 'icmp' }
  | { type: 'host'; value: string; direction?: 'src' | 'dst' } // IP address
  | { type: 'net'; value: string; direction?: 'src' | 'dst' } // CIDR block
  | { type: 'port'; value: number; direction?: 'src' | 'dst' }
  | { type: 'and'; left: BpfExpression; right: BpfExpression }
  | { type: 'or'; left: BpfExpression; right: BpfExpression }
  | { type: 'not'; expression: BpfExpression }
  | { type: 'empty' }; // Represents an empty filter

export type BpfAST = BpfExpression;
