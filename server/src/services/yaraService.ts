// @ts-ignore
import YARA from 'libyara-wasm';
import fs from 'fs';
import path from 'path';

export interface YaraMatch {
  rule: string;
  description?: string;
  tags: string[];
  matches: { offset: number; length: number; data?: string }[];
}

export class YaraService {
  private static instance: YaraService;
  private yaraInstance: any = null;
  private rules: any[] = []; // Store compiled rules? Or source?
  // libyara-wasm usually compiles a source string into a scanner/module.
  // We might need to keep the "scanner" state.

  // Simple in-memory storage for rule sources for now
  private ruleSources: { name: string; source: string }[] = [];
  private scanner: any = null;
  private initialized: boolean = false;

  private readonly RULES_FILE = path.join(
    process.cwd(),
    'data',
    'yara_rules.json',
  );

  private constructor() {
    this.loadStoredRules();
  }

  public static getInstance(): YaraService {
    if (!YaraService.instance) {
      YaraService.instance = new YaraService();
    }
    return YaraService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize WASM
      this.yaraInstance = await YARA();
      this.initialized = true;
      console.log('YARA WASM initialized');

      // Compile existing rules
      await this.compileRules();
    } catch (error) {
      console.error('Failed to initialize YARA:', error);
    }
  }

  private loadStoredRules() {
    try {
      if (fs.existsSync(this.RULES_FILE)) {
        this.ruleSources = JSON.parse(
          fs.readFileSync(this.RULES_FILE, 'utf-8'),
        );
      } else {
        const dir = path.dirname(this.RULES_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        // Add a default rule for testing
        // Add default rules for demo scenarios
        this.ruleSources = [
          {
            name: 'SQLInjection_Classic',
            source:
              "rule SQLInjection_Classic { strings: $a = \"OR '1'='1\" condition: $a }",
          },
          {
            name: 'SQLInjection_Union',
            source:
              'rule SQLInjection_Union { strings: $a = "UNION SELECT" nocase condition: $a }',
          },
          {
            name: 'XSS_Attack',
            source:
              'rule XSS_Attack { strings: $a = "<script>" nocase condition: $a }',
          },
          {
            name: 'Suspicious_JSON_Cmd',
            source:
              'rule Suspicious_JSON_Cmd { strings: $a = "\\"cmd\\": \\"exec\\"" condition: $a }',
          },
          {
            name: 'Malicious_Site',
            source:
              'rule Malicious_Site { strings: $a = "Host: malicious-site.com" nocase condition: $a }',
          },
          {
            name: 'Command_Injection_Eval',
            source:
              'rule Command_Injection_Eval { strings: $a = "eval(document.cookie)" condition: $a }',
          },
          {
            name: 'Test_Rule_HTTP',
            source:
              'rule Test_Rule_HTTP { strings: $a = "HTTP" condition: $a }',
          },
        ];
        this.saveRules();
      }
    } catch (e) {
      this.ruleSources = [];
    }
  }

  private saveRules() {
    try {
      fs.writeFileSync(
        this.RULES_FILE,
        JSON.stringify(this.ruleSources, null, 2),
      );
    } catch (e) {}
  }

  public async compileRules(): Promise<void> {
    // No-op: libyara-wasm compiles during run
  }

  public async scanPayload(buffer: Buffer): Promise<YaraMatch[]> {
    if (!this.yaraInstance) return [];

    try {
      // libyara-wasm expects a binary string (latin1) for the payload
      // Efficiently build string from buffer
      let payloadStr = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        payloadStr += String.fromCharCode.apply(
          null,
          buffer.subarray(i, i + chunkSize) as unknown as number[],
        );
      }

      const activeRules = this.ruleSources.map((r) => r.source).join('\n');
      if (!activeRules.trim()) return [];

      const result = this.yaraInstance.run(payloadStr, activeRules);

      const matches: YaraMatch[] = [];

      if (result.matchedRules) {
        for (let i = 0; i < result.matchedRules.size(); i++) {
          const match = result.matchedRules.get(i);
          const resolvedMatches: {
            offset: number;
            length: number;
            data?: string;
          }[] = [];

          if (match.resolvedMatches) {
            for (let j = 0; j < match.resolvedMatches.size(); j++) {
              const rm = match.resolvedMatches.get(j);
              resolvedMatches.push({
                offset: rm.location,
                length: rm.matchLength || rm.match_length,
                data: rm.data,
              });
            }
          }

          matches.push({
            rule: match.ruleName || match.rule_name,
            tags: [], // Metadata/Tags extraction if needed
            matches: resolvedMatches,
          });
        }
      }

      if (result.delete) result.delete();
      return matches;
    } catch (error) {
      console.error('YARA Scan failed:', error);
      return [];
    }
  }

  public async addRule(name: string, source: string): Promise<void> {
    this.ruleSources.push({ name, source });
    this.saveRules();
    await this.compileRules();
  }

  public getRules() {
    return this.ruleSources;
  }
}

export const yaraService = YaraService.getInstance();
