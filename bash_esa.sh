#!/usr/bin/env bash
# ------------------------------------------------------------
# Epic & Story Automation (ESA)
# ------------------------------------------------------------
# Sequentially processes epics and stories from sprint-status.yaml
# and triggers the appropriate workflows based on status.
# ------------------------------------------------------------

set -euo pipefail
IFS=$'\n\t'

SPRINT_FILE="docs/sprint-status.yaml"
BMAD_ROOT=".bmad/bmm"
AGENTS_DIR="$BMAD_ROOT/agents"
WORKFLOWS_DIR="$BMAD_ROOT/workflows/4-implementation"
SM_AGENT="sm"
DEV_AGENT="dev"
LLM_MODEL="gemini-2.5-flash"


# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------

log() {
    echo "[ESA] $1" >&2
}

# Check for yq
if ! command -v yq &> /dev/null; then
    log "Error: yq is required but not installed."
    exit 1
fi

# Function to read a value from YAML
read_yaml() {
    local key=$1
    yq -r ".development_status[\"$key\"]" "$SPRINT_FILE"
}

# Function to write a value to YAML
write_yaml() {
    local key=$1
    local new_val=$2
    yq -y -i ".development_status[\"$key\"] = \"$new_val\"" "$SPRINT_FILE"
}

# Process Gemini output to extract files
# Process Gemini output to extract files
process_gemini_output() {
    python3 - <<EOF
import sys
import re
import os

def process_stream():
    buffer = ""
    # Regex to capture <template-output file="...">content</template-output>
    # Using dotall to match across newlines
    # Simplified regex to avoid shell/python quoting hell
    pattern = re.compile(r'<template-output\s+file="([^"]+)">(.*?)</template-output>', re.DOTALL)
    
    content = sys.stdin.read()
    
    # Print the raw content to stdout so the user can see it
    print(content)
    
    # Find all matches
    matches = pattern.findall(content)
    
    seen_files = set()

    for filename, file_content in matches:
        # Resolve path (relative to current dir)
        filepath = os.path.abspath(filename)
        directory = os.path.dirname(filepath)
        
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        # Determine mode: write (overwrite) if first time seeing file in this stream, append otherwise
        mode = "w"
        if filepath in seen_files:
            mode = "a"
        else:
            seen_files.add(filepath)

        with open(filepath, mode) as f:
            # Add a newline before appending if it's not the first chunk
            if mode == "a":
                f.write("\n")
            f.write(file_content.strip())
            
        print(f"\n[ESA] >>> Generated file: {filename} (mode: {mode})", file=sys.stderr)

if __name__ == "__main__":
    process_stream()
EOF
}

# Verify that a file exists
verify_artifact_exists() {
    local filepath=$1
    if [[ -f "$filepath" ]]; then
        log "Verification PASSED: File $filepath exists."
        return 0
    else
        log "Verification FAILED: File $filepath does NOT exist."
        return 1
    fi
}

# Get the status from the story file (looks for "Status: value")
get_story_status_from_file() {
    local filepath=$1
    if [[ ! -f "$filepath" ]]; then
        echo "unknown"
        return
    fi
    # Extract status, assume format "Status: value" or "**Status**: value"
    # Case insensitive grep
    local status_line=$(grep -i "^Status:" "$filepath" || grep -i "^\*\*Status\*\*:" "$filepath" | head -n 1)
    # Clean up string: remove label and whitespace
    local status_val=${status_line#*:}
    status_val=${status_val//\*/} # Remove asterisks
    status_val=$(echo "$status_val" | xargs) # Trim whitespace
    echo "$status_val" | tr '[:upper:]' '[:lower:]'
}


# Execute a workflow using Gemini CLI with constructed prompt
run_gemini_workflow() {
    local agent_name=$1      # e.g., "sm"
    local workflow_name=$2   # e.g., "epic-tech-context"
    # Automatically inject sprint_status_file and output_folder into context
    # Use absolute path for output_folder to be safe, or relative "docs"
    local context_vars="$3 sprint_status_file=$SPRINT_FILE output_folder=docs"    # e.g., "epic_id=123 story_id=456 sprint_status_file=docs/sprint-status.yaml output_folder=docs"

    local agent_file="$AGENTS_DIR/${agent_name}.md"
    local workflow_file="$WORKFLOWS_DIR/${workflow_name}/instructions.md"

    if [[ ! -f "$agent_file" ]]; then
        log "Error: Agent file $agent_file not found."
        return 1
    fi

    if [[ ! -f "$workflow_file" ]]; then
        log "Error: Workflow file $workflow_file not found."
        return 1
    fi

    # 1. Read the workflow instructions
    local prompt_content=$(cat "$workflow_file")

    # 2. Perform variable substitution (Simple template replacement)
    # Iterates over "key=value" pairs in context_vars
    IFS=' ' read -r -a pairs <<< "$context_vars"
    for pair in "${pairs[@]}"; do
        local key=${pair%%=*}
        local val=${pair#*=}
        # Replace {{key}} with value
        prompt_content=${prompt_content//\{\{$key\}\}/$val}
    done

    # 3. Construct the final prompt with Agent Persona + Workflow
    local full_prompt="
$(cat "$agent_file")

---
# IMMEDIATE ACTION REQUIRED
# EXECUTE THE FOLLOWING WORKFLOW INSTRUCTIONS NOW
# DO NOT WAIT FOR USER INPUT
# DO NOT SHOW MENU
# START AT STEP 1

$prompt_content
"

    log ">>> Running Gemini Workflow: $workflow_name ($agent_name) [$context_vars]"
    
    # 4. Execute Gemini and pipe to processor
    # We capture exit code of gemini, not the pipe
    set +e # Temporarily disable exit-on-error to handle pipe status manually if needed
    
    gemini --model "$LLM_MODEL" --yolo "$full_prompt" | process_gemini_output
    
    local gemini_exit_code=${PIPESTATUS[0]} # Get exit status of first command in pipe (Bash specific)
    set -e
    
    if [[ $gemini_exit_code -ne 0 ]]; then
        log "Error: Gemini execution failed for $workflow_name"
        return 1
    fi
}

# -------------------------------------------------------------------
# Main Logic
# -------------------------------------------------------------------

# 1. Get all keys from development_status
keys=($(yq -r '.development_status | keys | .[]' "$SPRINT_FILE"))

# Identify Epics
epics=()
for key in "${keys[@]}"; do
    if [[ $key == epic-* && $key != *-retrospective ]]; then
        epics+=($key)
    fi
done

# Sort epics naturally (epic-1, epic-2, ...)
# Bash sorting
epics=($(printf "%s\n" "${epics[@]}" | sort -V))

log "Found epics: ${epics[*]}"

for epic_key in "${epics[@]}"; do
    epic_id=${epic_key#epic-}
    log "Processing $epic_key..."

    # --- Epic Status Check ---
    epic_status=$(read_yaml "$epic_key")
    
    if [[ "$epic_status" != "contexted" ]]; then
        # Epic is backlog (or other non-contexted status)
        run_gemini_workflow "$SM_AGENT" "epic-tech-context" "epic_id=${epic_key#epic-}"
        
        # Verify artifact creation
        if verify_artifact_exists "docs/tech-spec-epic-${epic_key#epic-}.md"; then
            # Update status to contexted
            write_yaml "$epic_key" "contexted"
            epic_status="contexted"
            log "Updated $epic_key status to contexted"
        else
            log "Error: Failed to create tech spec for $epic_key. Skipping status update."
        fi
    fi

    # --- Process Stories for this Epic ---
    # Find stories belonging to this epic
    # Assuming format: N-M-story-name where N is epic number
    stories=()
    for key in "${keys[@]}"; do
        if [[ $key == $epic_id-* ]]; then
            stories+=($key)
        fi
    done
    
    # Sort stories
    stories=($(printf "%s\n" "${stories[@]}" | sort -V))

    for story_key in "${stories[@]}"; do
        log "  Checking story: $story_key"
        
        while true; do
            story_status=$(read_yaml "$story_key")
            log "    Current status: $story_status"

            if [[ "$story_status" == "done" ]]; then
                break # Move to next story
            fi

            # Explicit State Machine for Story Processing
            case "$story_status" in
                "backlog")
                    log "  -> Status: backlog. Action: Create Story."
                    # Pass default_output_file for create-story if it supports it, or just story_id
                    # create-story usually determines path itself, but let's be consistent if possible.
                    # Checking instructions, it uses {default_output_file} in template-output.
                    # We can try passing it.
                    run_gemini_workflow "$SM_AGENT" "create-story" "story_id=$story_key default_output_file=docs/stories/${story_key}.md"
                    
                    if verify_artifact_exists "docs/stories/${story_key}.md"; then
                        write_yaml "$story_key" "drafted"
                    else
                        log "Error: Story file docs/stories/${story_key}.md not created. Retrying next loop."
                        continue
                    fi
                    ;;

                "drafted")
                    log "  -> Status: drafted. Action: Create Story Context."
                    # Precondition: Story file must exist
                    if ! verify_artifact_exists "docs/stories/${story_key}.md"; then
                        log "Error: Cannot run story-context. Story file docs/stories/${story_key}.md missing."
                        continue
                    fi

                    run_gemini_workflow "$SM_AGENT" "story-context" "story_id=$story_key story_path=docs/stories/${story_key}.md"
                    
                    if verify_artifact_exists "docs/stories/${story_key}.context.xml"; then
                        write_yaml "$story_key" "ready-for-dev"
                    else
                        log "Error: Context file docs/stories/${story_key}.context.xml not created. Retrying next loop."
                        continue
                    fi
                    ;;

                "ready-for-dev" | "in-progress")
                    log "  -> Status: $story_status. Action: Develop Story."
                    # Preconditions
                    if ! verify_artifact_exists "docs/stories/${story_key}.md"; then
                        log "Error: Cannot run dev-story. Story file docs/stories/${story_key}.md missing."
                        continue
                    fi
                    if ! verify_artifact_exists "docs/stories/${story_key}.context.xml"; then
                        log "Error: Cannot run dev-story. Context file docs/stories/${story_key}.context.xml missing."
                        continue
                    fi

                    if [[ "$story_status" == "ready-for-dev" ]]; then
                        write_yaml "$story_key" "in-progress"
                    fi

                    run_gemini_workflow "$DEV_AGENT" "dev-story" "story_id=$story_key story_path=docs/stories/${story_key}.md"
                    
                    # Verify status in file
                    current_file_status=$(get_story_status_from_file "docs/stories/${story_key}.md")
                    if [[ "$current_file_status" == "review" ]]; then
                        write_yaml "$story_key" "review"
                    elif [[ "$current_file_status" == "in-progress" ]]; then
                         # Ensure yaml is in-progress (might have been ready-for-dev)
                        write_yaml "$story_key" "in-progress"
                        log "Story $story_key still in-progress. Continuing loop."
                    else
                        log "Warning: Unexpected status '$current_file_status' in story file. Keeping as in-progress."
                        write_yaml "$story_key" "in-progress"
                    fi
                    ;;

                "review")
                    log "  -> Status: review. Action: Code Review."
                    # Precondition
                    if ! verify_artifact_exists "docs/stories/${story_key}.md"; then
                        log "Error: Cannot run code-review. Story file docs/stories/${story_key}.md missing."
                        continue
                    fi

                    run_gemini_workflow "$DEV_AGENT" "code-review" "story_id=$story_key story_path=docs/stories/${story_key}.md"
                    
                    # Verify status update from code review
                    current_file_status=$(get_story_status_from_file "docs/stories/${story_key}.md")
                    if [[ "$current_file_status" == "done" ]]; then
                        log "    >>> Code Review PASSED"
                        write_yaml "$story_key" "done"
                    elif [[ "$current_file_status" == "in-progress" ]]; then
                        log "    >>> Code Review FAILED (Requesting changes)"
                        write_yaml "$story_key" "in-progress"
                    else
                        log "    >>> Code Review status: $current_file_status (Staying in review)"
                        # write_yaml "$story_key" "review" # Already in review
                    fi
                    ;;
                
                *)
                    log "  -> Status: $story_status. No action defined or unknown status."
                    ;;
            esac
        done
    done
    
    log "Finished processing stories for $epic_key"

    # --- Epic Retrospective Check ---
    all_stories_done=true
    for story_key in "${stories[@]}"; do
        story_status=$(read_yaml "$story_key")
        if [[ "$story_status" != "done" ]]; then
            all_stories_done=false
            break
        fi
    done

    if [[ "$all_stories_done" == "true" ]]; then
        retro_key="${epic_key}-retrospective"
        retro_status=$(read_yaml "$retro_key")
        
        if [[ "$retro_status" != "completed" ]]; then
            log "All stories done for $epic_key. Running retrospective..."
            run_gemini_workflow "$SM_AGENT" "retrospective" "epic_id=${epic_key#epic-}"
            write_yaml "$retro_key" "completed"
            log "Updated $retro_key to completed"
        else
            log "Retrospective already completed for $epic_key"
        fi
    else
        log "Not all stories done for $epic_key. Skipping retrospective."
        # Stop processing further epics if this one isn't fully complete?
        # The requirement says "seqentially process". 
        # Usually implies we finish one before moving to the next.
        # If we are strictly sequential, we should break here.
        log "Stopping sequential processing at $epic_key."
        break
    fi
done

log "All epics processed."
