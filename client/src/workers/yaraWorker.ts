// client/src/workers/yaraWorker.ts
import libyara from 'libyara-wasm';

let yaraModule: any = null;

// Initialize the WASM module
const initPromise = libyara()
  .then((Module: any) => {
    yaraModule = Module;
    console.log('YARA WASM module initialized');
  })
  .catch((err: any) => {
    console.error('Failed to initialize YARA WASM:', err);
  });

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    await initPromise;
    if (!yaraModule) throw new Error('YARA module not initialized');

    if (type === 'compile') {
      // libyara-wasm compiles and runs in one step via 'run', so we just validate here if possible
      // or simply acknowledge. The actual compilation happens during scan in this library's wrapper.
      // Wait, the library exposes 'run(payload, rules)'. It doesn't seem to expose a separate compile step
      // that returns a compiled object to be reused. This is inefficient for repeated scans with same rules.
      // But based on the API probe, we only saw 'run'.
      // Let's check if we can cache the rules string.

      // For now, we'll just store the rules string to be used in scan.
      // The 'payload' here is the rules string array.
      const rules = (payload as string[]).join('\n');
      (self as any).activeRules = rules;

      self.postMessage({
        type: 'compileResult',
        id,
        success: true,
        ruleCount: payload.length,
      });
    } else if (type === 'scan') {
      const rules = (self as any).activeRules || '';
      if (!rules) {
        self.postMessage({
          type: 'scanResult',
          id,
          success: true,
          matches: [],
        });
        return;
      }

      // Payload is Uint8Array. libyara-wasm 'run' takes std::string for buffer.
      // We need to convert Uint8Array to string.
      // WARNING: Binary data might be corrupted if simply decoded as UTF-8.
      // However, the library expects std::string. Emscripten's string mapping might handle binary
      // if we pass it correctly, but usually JS strings are UTF-16.
      // If the C++ side expects raw bytes, passing a JS string might be problematic for binary payloads.
      // Let's try to decode as latin1 (binary string) to preserve bytes.
      let payloadStr = '';
      // Efficiently build string from buffer
      // For large buffers this might be slow.
      // payload is Uint8Array
      const chunkSize = 0x8000;
      for (let i = 0; i < payload.length; i += chunkSize) {
        payloadStr += String.fromCharCode.apply(
          null,
          payload.subarray(i, i + chunkSize) as any,
        );
      }

      const result = yaraModule.run(payloadStr, rules);

      const matches: any[] = [];

      if (result.matchedRules) {
        for (let i = 0; i < result.matchedRules.size(); i++) {
          const match = result.matchedRules.get(i);
          const resolvedMatches: any[] = [];

          if (match.resolvedMatches) {
            for (let j = 0; j < match.resolvedMatches.size(); j++) {
              const rm = match.resolvedMatches.get(j);
              resolvedMatches.push({
                identifier: rm.stringIdentifier || rm.string_identifier, // Check both just in case
                offset: rm.location,
                length: rm.matchLength || rm.match_length,
                data: rm.data,
              });
            }
          }

          // Metadata extraction
          const meta: Record<string, any> = {};
          if (match.metadata) {
            for (let k = 0; k < match.metadata.size(); k++) {
              const m = match.metadata.get(k);
              meta[m.identifier] = m.data;
            }
          }

          matches.push({
            rule: match.ruleName || match.rule_name,
            meta: meta,
            matches: resolvedMatches,
          });
        }
      }

      // Clean up result object if needed (Embind)
      if (result.delete) result.delete();

      self.postMessage({ type: 'scanResult', id, success: true, matches });
    }
  } catch (err: any) {
    console.error('YARA Worker Error:', err);
    self.postMessage({ type: 'error', id, error: err.message });
  }
};
