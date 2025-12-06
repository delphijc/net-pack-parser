import type { Packet } from '../types/packet';
import type { BpfAST, BpfToken, BpfTokenType, BpfExpression } from './bpfTypes';
export type { BpfAST, BpfToken, BpfTokenType, BpfExpression };

// ... (rest of file)

// Re-export Packet interface for consistency
export type { Packet };

/**
 * Converts a BPF filter string into a stream of BpfToken objects.
 * This is a simplified tokenizer and may not cover all BPF complexities.
 */
function tokenizeBpfExpression(expression: string): BpfToken[] {
  const tokens: BpfToken[] = [];
  let i = 0;

  const keywords = [
    'tcp',
    'udp',
    'icmp',
    'host',
    'net',
    'port',
    'src',
    'dst',
    'and',
    'or',
    'not',
  ];
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  const cidrPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}/;

  while (i < expression.length) {
    const char = expression[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Handle parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char });
      i++;
      continue;
    }

    // Handle keywords, IP addresses, CIDR blocks, numbers
    let value = '';
    if (/[a-zA-Z0-9./]/.test(char)) {
      while (i < expression.length && /[a-zA-Z0-9./]/.test(expression[i])) {
        value += expression[i];
        i++;
      }

      if (keywords.includes(value.toLowerCase())) {
        tokens.push({ type: 'KEYWORD', value: value.toLowerCase() });
      } else if (value.match(cidrPattern)) {
        tokens.push({ type: 'CIDR_BLOCK', value: value });
      } else if (value.match(ipPattern)) {
        tokens.push({ type: 'IP_ADDRESS', value: value });
      } else if (!isNaN(Number(value))) {
        tokens.push({ type: 'NUMBER', value: value });
      } else {
        tokens.push({ type: 'UNKNOWN', value: value });
      }
      continue;
    }

    // Default for unknown single characters
    tokens.push({ type: 'UNKNOWN', value: char });
    i++;
  }

  tokens.push({ type: 'EOS', value: '' }); // End of Stream
  return tokens;
}

/**
 * Parses a stream of BpfTokens into a BpfAST.
 * This is a very simplified parser, implementing a basic recursive descent approach.
 */
/**
 * Parses a stream of BpfTokens into a BpfAST.
 * This is a very simplified parser, implementing a basic recursive descent approach.
 */
export function parseBpfFilter(expression: string | BpfToken[]): BpfAST | null {
  const tokens =
    typeof expression === 'string'
      ? tokenizeBpfExpression(expression)
      : expression;

  let current = 0;

  function peek(): BpfToken {
    return tokens[current];
  }

  function consume(type: BpfTokenType, value?: string): BpfToken {
    const token = tokens[current];
    if (token.type === type && (value === undefined || token.value === value)) {
      current++;
      return token;
    }
    throw new Error(
      `Unexpected token: expected ${type} (value: ${value || 'any'}), got ${token.type} (value: ${token.value})`,
    );
  }

  // Expression -> Term (("and" | "or") Term)*
  function parseExpression(): BpfExpression {
    let left = parseTerm();

    while (
      peek().type === 'KEYWORD' &&
      (peek().value === 'and' || peek().value === 'or')
    ) {
      const operator = consume('KEYWORD');
      const right = parseTerm();
      if (operator.value === 'and') {
        left = { type: 'and', left, right };
      } else {
        left = { type: 'or', left, right };
      }
    }
    return left;
  }

  // Term -> "not" Term | Primitive | "(" Expression ")"
  function parseTerm(): BpfExpression {
    if (peek().type === 'KEYWORD' && peek().value === 'not') {
      consume('KEYWORD', 'not');
      const expr = parseTerm();
      return { type: 'not', expression: expr };
    }

    if (peek().type === 'LPAREN') {
      consume('LPAREN');
      const expr = parseExpression();
      consume('RPAREN');
      return expr;
    }

    return parsePrimitive();
  }

  // Primitive -> "tcp" | "udp" | "icmp" | "host" IP | "net" CIDR | "port" NUMBER | DIRECTION Primitive
  function parsePrimitive(): BpfExpression {
    let direction: 'src' | 'dst' | undefined;
    if (
      peek().type === 'KEYWORD' &&
      (peek().value === 'src' || peek().value === 'dst')
    ) {
      direction = consume('KEYWORD').value as 'src' | 'dst';
    }

    const keywordToken = consume('KEYWORD');
    const keyword = keywordToken.value;

    switch (keyword) {
      case 'tcp':
      case 'udp':
      case 'icmp':
        if (direction) {
          throw new Error(
            `Direction not applicable to protocol keyword: ${keyword}`,
          );
        }
        return { type: 'protocol', value: keyword };
      case 'host': {
        const hostToken = consume('IP_ADDRESS');
        return { type: 'host', value: hostToken.value, direction };
      }
      case 'net': {
        const netToken = consume('CIDR_BLOCK');
        return { type: 'net', value: netToken.value, direction };
      }
      case 'port': {
        const portToken = consume('NUMBER');
        return { type: 'port', value: Number(portToken.value), direction };
      }
      default:
        throw new Error(`Unknown primitive: ${keyword}`);
    }
  }

  const ast = parseExpression();
  if (peek().type !== 'EOS') {
    throw new Error('Unexpected tokens at the end of the expression.');
  }
  return ast;
}

/**
 * Validates a BPF filter expression.
 * @param expression The BPF filter string.
 * @returns An object indicating validity and an error message if invalid.
 */
export function validateBpfFilter(expression: string): {
  isValid: boolean;
  error?: string;
  ast?: BpfAST;
} {
  if (expression.trim() === '') {
    return { isValid: true };
  }
  try {
    const ast = parseBpfFilter(expression);
    return { isValid: true, ast: ast || undefined };
  } catch (err: unknown) {
    return { isValid: false, error: (err as Error).message };
  }
}

/**
 * Matches a packet against a parsed BPF filter AST.
 * @param packet The packet to match.
 * @param ast The BPF filter AST.
 * @returns True if the packet matches the filter, false otherwise.
 */
export function matchBpfFilter(packet: Packet, ast: BpfAST): boolean {
  if (!ast || ast.type === 'empty') {
    return true; // An empty or null AST matches all packets
  }

  function evaluate(node: BpfExpression): boolean {
    switch (node.type) {
      case 'protocol': {
        const protocol = packet.protocol.toLowerCase();
        return protocol === node.value;
      }
      case 'host': {
        const isSrcHost = packet.sourceIP === node.value;
        const isDstHost = packet.destIP === node.value;
        if (node.direction === 'src') {
          return isSrcHost;
        }
        if (node.direction === 'dst') {
          return isDstHost;
        }
        return isSrcHost || isDstHost;
      }
      case 'net': {
        // Simplified CIDR match (e.g., "192.168.1.0/24")
        const [ip, mask] = node.value.split('/');
        const maskNum = parseInt(mask, 10);
        const ipToNum = (ipAddr: string) =>
          ipAddr
            .split('.')
            .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
        const filterNetwork = ipToNum(ip) >>> (32 - maskNum);

        const checkIp = (ipAddr: string) => {
          const packetIp = ipToNum(ipAddr);
          return packetIp >>> (32 - maskNum) === filterNetwork;
        };

        const isSrcNet = checkIp(packet.sourceIP);
        const isDstNet = checkIp(packet.destIP);

        if (node.direction === 'src') {
          return isSrcNet;
        }
        if (node.direction === 'dst') {
          return isDstNet;
        }
        return isSrcNet || isDstNet;
      }
      case 'port': {
        const isSrcPort = packet.sourcePort === node.value;
        const isDstPort = packet.destPort === node.value;
        if (node.direction === 'src') {
          return isSrcPort;
        }
        if (node.direction === 'dst') {
          return isDstPort;
        }
        return isSrcPort || isDstPort;
      }
      case 'and':
        return evaluate(node.left) && evaluate(node.right);
      case 'or':
        return evaluate(node.left) || evaluate(node.right);
      case 'not':
        return !evaluate(node.expression);
      case 'empty':
        return true;
      default:
        // This should ideally not happen if AST is well-formed.
        console.warn('Unknown BpfExpression type in AST:', node);
        return false;
    }
  }

  return evaluate(ast);
}
