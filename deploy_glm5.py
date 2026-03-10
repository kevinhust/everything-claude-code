#!/usr/bin/env python3
import os
import subprocess
import sys
from pathlib import Path

def setup_env_vars():
    print("Step 1: Configuring environment variables in ~/.zshrc...")
    zshrc = Path.home() / ".zshrc"
    
    env_vars = {
        "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
        "ANTHROPIC_AUTH_TOKEN": "eff8a82654c740f18a194b5ddbdefe2d.51wcKYDn3HnRRTCx",
        "ANTHROPIC_MODEL": "glm-5"
    }
    
    if not zshrc.exists():
        zshrc.touch()
        
    with open(zshrc, "r") as f:
        content = f.read()
    
    new_content = content
    modified = False
    
    for var, value in env_vars.items():
        export_line = f'export {var}="{value}"'
        if export_line not in content:
            print(f"  Adding {var}...")
            new_content += f"\n{export_line}"
            modified = True
        else:
            print(f"  {var} already configured.")
            
    if modified:
        with open(zshrc, "w") as f:
            f.write(new_content)
        print("Done. Please run 'source ~/.zshrc' after this script finishes.")
    else:
        print("No changes needed for ~/.zshrc.")

def register_plugin():
    print("\nStep 2: Registering everything-claude-code plugin...")
    repo_path = Path(__file__).parent.absolute()
    
    try:
        # Check if plugin is already added
        result = subprocess.run(["claude", "config", "list"], capture_output=True, text=True)
        if str(repo_path) in result.stdout:
            print("  Plugin already registered in Claude Code.")
            return

        print(f"  Registering plugin at {repo_path}...")
        subprocess.run(["claude", "config", "add", "plugin", str(repo_path)], check=True)
        print("  Plugin registered successfully.")
    except FileNotFoundError:
        print("  Warning: 'claude' command not found. Please ensure Claude Code is installed.")
    except subprocess.CalledProcessError as e:
        print(f"  Error registering plugin: {e}")

def main():
    print("=== GLM-5 Configuration Auto-Deploy ===")
    
    # 1. Setup Env Vars
    setup_env_vars()
    
    # 2. Register Plugin
    register_plugin()
    
    print("\n=== Setup Complete! ===")
    print("CRITICAL: Please run the following command to activate the changes:")
    print("source ~/.zshrc")
    print("========================================")

if __name__ == "__main__":
    main()
