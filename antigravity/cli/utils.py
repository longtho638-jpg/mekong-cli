"""
CLI Utility functions for AntigravityKit.

Contains helper functions used across CLI commands.
"""


def print_banner():
    """Print AntigravityKit banner."""
    print("""
===========================================================

   ANTIGRAVITYKIT

   Doc dao - Doc quyen - Doc nhat - Duy nhat
   The WOW Toolkit for Southeast Asian Solo Agencies

   "De nhu an keo" - Easy as candy

===========================================================
    """)


def print_help():
    """Show help menu."""
    print("""
===========================================================
  ANTIGRAVITYKIT COMMANDS
===========================================================

  Tier 1: Student (De nhu an keo)
  -----------------------------------------------------------
  start                  Bootstrap agency (5 min)
  client:add "Name"      Add a new client
  content:generate 30    Generate 30 content ideas
  stats                  Show dashboard

  Tier 2: Solo Agency
  -----------------------------------------------------------
  crm                    CRM dashboard
  pipeline               Sales pipeline
  proposal "Client"      Generate proposal

  Tier 3: Pro Agency
  -----------------------------------------------------------
  crew:deploy            Deploy AI agent crew
  analytics              Full analytics
  franchise              Franchise management

===========================================================
  VIBE IDE (Development Workflow)
  -----------------------------------------------------------
  vibe:code [plan]       Run 6-step dev workflow
  vibe:plan "Title"      Create implementation plan
  vibe:status            Show IDE dashboard

===========================================================
    """)
