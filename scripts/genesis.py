#!/usr/bin/env python3
"""
AGENCY-GENESIS: The Self-Replicating Code Controller
"""
import subprocess
import pexpect
import yaml
import sys
import os

class AgencyGenesis:
    def __init__(self):
        self.dna_path = "claudekit_dna/"
        self.manifest_path = "vibe_manifest.yaml"
        self.manifest = self.load_manifest()

    def load_manifest(self):
        if not os.path.exists(self.manifest_path):
            print(f"Manifest not found at {self.manifest_path}. Creating default...")
            default_manifest = {
                "version": "1.0",
                "project": "AgencyOS",
                "tasks": []
            }
            with open(self.manifest_path, 'w') as f:
                yaml.dump(default_manifest, f)
            return default_manifest

        with open(self.manifest_path) as f:
            return yaml.safe_load(f)

    def inject_dna(self, task):
        """Load relevant ClaudeKit patterns for task"""
        # Placeholder for DNA injection logic
        # In a real scenario, this would read from self.dna_path
        context = f"Context for task {task.get('id', 'unknown')}"
        if 'dna_reference' in task:
            context += f"\nReference: {task['dna_reference']}"
        return context

    def execute_claude(self, prompt):
        """Run Claude Code CLI with auto-approve"""
        print(f"Executing Claude with prompt: {prompt[:50]}...")
        # Note: In a real environment, we ensure 'claude' is in PATH
        # We use --print-output to capture result if needed, though pexpect handles interaction
        cmd = f'claude "{prompt}"'

        try:
            child = pexpect.spawn(cmd, encoding='utf-8')
            child.logfile = sys.stdout # Stream output to stdout

            while True:
                # Expect permission prompt or EOF
                index = child.expect([
                    r'\(y/n\)',      # Permission prompt
                    pexpect.EOF,
                    pexpect.TIMEOUT
                ], timeout=300)

                if index == 0:
                    # Permission prompt detected
                    print("\n[GENESIS] Auto-approving permission request...")
                    child.sendline('y')
                elif index == 1:
                    # EOF - process finished
                    break
                elif index == 2:
                    # Timeout
                    print("\n[GENESIS] Operation timed out.")
                    break

            child.close()
            return child.exitstatus
        except Exception as e:
            print(f"\n[GENESIS] Error executing Claude: {e}")
            return 1

    def run_loop(self):
        """Main autonomous loop"""
        if not self.manifest.get('tasks'):
            print("No tasks found in manifest.")
            return

        for task in self.manifest['tasks']:
            print(f"\n>>> Processing Task: {task.get('description')}")
            context = self.inject_dna(task)
            prompt = f"{context}\n\nTask: {task['description']}"

            if task.get('auto_approve', False):
                self.execute_claude(prompt)
            else:
                print("Task does not have auto_approve set. Skipping autonomous execution.")

if __name__ == "__main__":
    # Ensure dependencies are installed
    try:
        import pexpect
        import yaml
    except ImportError:
        print("Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pexpect", "pyyaml"])
        import pexpect
        import yaml

    genesis = AgencyGenesis()
    genesis.run_loop()
