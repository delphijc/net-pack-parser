const libyara = require('libyara-wasm');

console.log('Type of libyara:', typeof libyara);

libyara()
  .then((Module) => {
    console.log('Module loaded');
    console.log('Keys in Module:', Object.keys(Module));

    // Check for 'run' or similar
    if (Module.run) console.log('Module.run exists');
    if (Module._run) console.log('Module._run exists');

    // Try to find the bound function
    // Emembind usually exposes classes or functions directly on Module

    // Let's try to compile a simple rule
    const rules = 'rule test { strings: $a = "hello" condition: $a }';
    const payload = 'hello world';

    try {
      // The C++ signature is run(string, string)
      // In Emscripten, this might be exposed directly if using embind
      if (Module.run) {
        const result = Module.run(payload, rules);
        console.log('Result Object:', result);
        console.log('Result Prototype:', Object.getPrototypeOf(result));

        // Try as functions
        try {
          console.log(
            'matched_rules():',
            result.matched_rules && result.matched_rules(),
          );
        } catch (e) {
          console.log('matched_rules() failed');
        }
        try {
          console.log(
            'get_matched_rules():',
            result.get_matched_rules && result.get_matched_rules(),
          );
        } catch (e) {
          console.log('get_matched_rules() failed');
        }

        // Check if properties are on the instance but not enumerable
        console.log('Own Property Names:', Object.getOwnPropertyNames(result));
        console.log(
          'Prototype Property Names:',
          Object.getOwnPropertyNames(Object.getPrototypeOf(result)),
        );

        // Try as functions
        try {
          console.log(
            'matched_rules():',
            result.matched_rules && result.matched_rules(),
          );
        } catch (e) {
          console.log('matched_rules() failed');
        }
        try {
          console.log(
            'get_matched_rules():',
            result.get_matched_rules && result.get_matched_rules(),
          );
        } catch (e) {
          console.log('get_matched_rules() failed');
        }

        // Check if properties are on the instance but not enumerable
        console.log('Own Property Names:', Object.getOwnPropertyNames(result));
        console.log('matchedRules property:', result.matchedRules);
        console.log('compileErrors property:', result.compileErrors);

        if (result.matchedRules) {
          console.log('Matched Rules Size:', result.matchedRules.size());
          for (let i = 0; i < result.matchedRules.size(); i++) {
            const match = result.matchedRules.get(i);
            console.log(`Match ${i}:`, match.rule_name); // Check if rule_name is also camelCase?

            // Inspect resolved matches
            // Check property name for resolved matches
            console.log(
              'Match keys:',
              Object.getOwnPropertyNames(Object.getPrototypeOf(match)),
            );

            if (match.resolved_matches) {
              // Might be resolvedMatches
              console.log(
                '  Resolved Matches (snake):',
                match.resolved_matches.size(),
              );
            }
            if (match.resolvedMatches) {
              console.log(
                '  Resolved Matches (camel):',
                match.resolvedMatches.size(),
              );
              for (let j = 0; j < match.resolvedMatches.size(); j++) {
                const rm = match.resolvedMatches.get(j);
                console.log(
                  `    Offset: ${rm.location}, Length: ${rm.match_length}, Data: ${rm.data}`,
                );
              }
            }
          }
        }

        if (result.compileErrors) {
          console.log('Compile Errors Size:', result.compileErrors.size());
          for (let i = 0; i < result.compileErrors.size(); i++) {
            const err = result.compileErrors.get(i);
            console.log(
              `Error ${i}: ${err.message} at line ${err.line_number}`,
            );
          }
        }

        // Clean up if necessary (Embind objects usually need .delete() if created manually,
        // but returned objects might be managed or need explicit deletion)
        if (result.delete) result.delete();
      }
    } catch (e) {
      console.error('Error running:', e);
    }
  })
  .catch((e) => {
    console.error('Error loading module:', e);
  });
