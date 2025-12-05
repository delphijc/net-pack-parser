declare module 'libyara-wasm' {
  interface YaraMatch {
    ruleName: string;
    rule_name?: string;
    resolvedMatches: {
      size(): number;
      get(index: number): {
        stringIdentifier: string;
        string_identifier?: string;
        location: number;
        matchLength: number;
        match_length?: number;
        data: string;
      };
    };
    resolved_matches?: any; // Alias for resolvedMatches if needed
    metadata: {
      size(): number;
      get(index: number): {
        identifier: string;
        data: string;
      };
    };
  }

  interface YaraResult {
    matchedRules: {
      size(): number;
      get(index: number): YaraMatch;
    };
    matched_rules?: any;
    compileErrors: {
      size(): number;
      get(index: number): {
        message: string;
        line_number: number;
      };
    };
    delete(): void;
  }

  interface YaraModule {
    run(payload: string, rules: string): YaraResult;
  }

  function libyara(): Promise<YaraModule>;
  export default libyara;
}
