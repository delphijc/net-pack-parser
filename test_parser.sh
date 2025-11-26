#!/usr/bin/env zsh

# Process Gemini output to extract files (Copied from esa.sh for testing)
process_gemini_output() {
    python3 -c '
import sys
import re
import os

def process_stream():
    buffer = ""
    # Regex to capture <template-output file="...">content</template-output>
    # Using dotall to match across newlines
    pattern = re.compile(r"<template-output\s+file=[\"'"'"']([^\"'"'"']+)[\"'"'"']>(.*?)</template-output>", re.DOTALL)
    
    content = sys.stdin.read()
    
    # Print the raw content to stdout so the user can see it
    print(content)
    
    # Find all matches
    matches = pattern.findall(content)
    
    for filename, file_content in matches:
        # Resolve path (relative to current dir)
        filepath = os.path.abspath(filename)
        directory = os.path.dirname(filepath)
        
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        with open(filepath, "w") as f:
            f.write(file_content.strip())
            
        print(f"\n[ESA] >>> Generated file: {filename}", file=sys.stderr)

if __name__ == "__main__":
    process_stream()
'
}

# Test Case
echo "Running test..."
echo "Some preamble text...
<template-output file='test_output_file.txt'>
This is the content of the test file.
It has multiple lines.
</template-output>
Some postscript text..." | process_gemini_output

if [[ -f "test_output_file.txt" ]]; then
    echo "SUCCESS: File created."
    cat test_output_file.txt
    rm test_output_file.txt
else
    echo "FAILURE: File not created."
    exit 1
fi
