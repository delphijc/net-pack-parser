#!/usr/bin/env zsh
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
LLM_MODEL="gemini-2.5-pro"


# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------

log() {
    echo "[ESA] $1"
}

# Check for yq
if ! command -v yq &> /dev/null; then
    log "Error: yq is required but not installed. Please install yq v4+."
    exit 1
fi

# Function to read a value from YAML
read_yaml() {
    local key=$1
    yq eval ".development_status[\"$key\"]" "$SPRINT_FILE"
}

# Function to write a value to YAML
write_yaml() {
    local key=$1
    local new_val=$2
    yq eval -i ".development_status[\"$key\"] = \"$new_val\"" "$SPRINT_FILE"
}

# Execute a workflow using Gemini CLI with constructed prompt
run_gemini_workflow() {
    local agent_name=$1      # e.g., "sm"
    local workflow_name=$2   # e.g., "epic-tech-context"
    local context_vars=$3    # e.g., "epic_id=123 story_id=456"

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
    for pair in ${(s: :)context_vars}; do
        local key=${pair%%=*}
        local val=${pair#*=}
        # Replace {{key}} with value
        prompt_content=${prompt_content//\{\{$key\}\}/$val}
    done

    # 3. Construct the final prompt with Agent Persona + Workflow
    local full_prompt="
$(cat "$agent_file")

---
# WORKFLOW INSTRUCTIONS
$prompt_content
"

    log ">>> Running Gemini Workflow: $workflow_name ($agent_name) [$context_vars]"
    
    # 4. Execute Gemini
    if ! gemini --model "$LLM_MODEL" --yolo "$full_prompt"; then
        log "Error: Gemini execution failed for $workflow_name"
        return 1
    fi
}

# -------------------------------------------------------------------
# Main Logic
# -------------------------------------------------------------------

# 1. Get all keys from development_status
keys=($(yq eval '.development_status | keys | .[]' "$SPRINT_FILE"))

# Identify Epics
epics=()
for key in $keys; do
    if [[ $key == epic-* && $key != *-retrospective ]]; then
        epics+=($key)
    fi
done

# Sort epics naturally (epic-1, epic-2, ...)
# Zsh sorting trick or simple sort
epics=($(echo ${(F)epics} | sort -V))

log "Found epics: ${epics[*]}"

for epic_key in $epics; do
    epic_id=${epic_key#epic-}
    log "Processing $epic_key..."

    # --- Epic Status Check ---
    epic_status=$(read_yaml "$epic_key")
    
    if [[ "$epic_status" != "contexted" ]]; then
        # Epic is backlog (or other non-contexted status)
        run_gemini_workflow "$SM_AGENT" "epic-tech-context" "epic_id=${epic_key#epic-}"
        
        # Update status to contexted
        #write_yaml "$epic_key" "contexted"
        epic_status="contexted"
        log "Updated $epic_key status to contexted"
    fi

    # --- Process Stories for this Epic ---
    # Find stories belonging to this epic
    # Assuming format: N-M-story-name where N is epic number
    stories=()
    for key in $keys; do
        if [[ $key == $epic_id-* ]]; then
            stories+=($key)
        fi
    done
    
    # Sort stories
    stories=($(echo ${(F)stories} | sort -V))

    for story_key in $stories; do
        log "  Checking story: $story_key"
        
        while true; do
            story_status=$(read_yaml "$story_key")
            log "    Current status: $story_status"

            if [[ "$story_status" == "done" ]]; then
                break # Move to next story
            fi

            if [[ "$story_status" == "backlog" ]]; then
                run_gemini_workflow "$SM_AGENT" "create-story" "story_id=$story_key"
                #write_yaml "$story_key" "drafted"
                
                run_gemini_workflow "$SM_AGENT" "story-context" "story_id=$story_key"
                #write_yaml "$story_key" "ready-for-dev"
                
            else
                # Status is drafted, ready-for-dev, in-progress, or review
                if [[ "$story_status" != "review" ]]; then
                    #write_yaml "$story_key" "in-progress"
                    run_gemini_workflow "$DEV_AGENT" "dev-story" "story_id=$story_key"
                    #write_yaml "$story_key" "review"
                fi

                # Code Review   
                run_gemini_workflow "$DEV_AGENT" "code-review" "story_id=$story_key"
                
                # Simulate code review outcome
                # In reality, the workflow or user would update the status.
                # Here we simulate a chance of passing or failing.
                #if (( RANDOM % 100 < 80 )); then
                #    log "    >>> Code Review PASSED"
                #    write_yaml "$story_key" "done"
                #else
                #    log "    >>> Code Review FAILED (Requesting changes)"
                #    write_yaml "$story_key" "in-progress" # Send back to dev
                #    # Loop continues, will hit "develop-story" next time because status != review
                #fi
            fi
        done
    done
    
    log "Finished processing stories for $epic_key"

    # --- Epic Retrospective Check ---
    all_stories_done=true
    for story_key in $stories; do
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
