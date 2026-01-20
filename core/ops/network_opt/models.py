"""
Configuration and constants for Network Optimization.
"""
from pathlib import Path

# Configuration
PING_TARGET = "1.1.1.1"
PING_THRESHOLD_MS = 100
LOG_FILE = Path.home() / ".network_optimizer.log"
WARP_CONFIG_FILE = Path.home() / ".warp_config.json"

# Preferred exit nodes (ordered by priority)
MULLVAD_NODES = [
    "sg-sin-wg-001.mullvad.ts.net",  # Singapore
    "hk-hkg-wg-201.mullvad.ts.net",  # Hong Kong
    "jp-tyo-wg-001.mullvad.ts.net",  # Tokyo
]

# WARP Optimization Constants
OPTIMAL_ENDPOINTS = [
    ("162.159.193.1", 2408),
    ("162.159.192.1", 2408),
    ("162.159.195.1", 2408),
    ("162.159.193.1", 500),
    ("162.159.192.1", 500),
    ("162.159.193.1", 4500),
    ("162.159.192.1", 4500),
    ("162.159.192.1", 1701),
]

ANYCAST_IPS = [
    "162.159.192.1",
    "162.159.193.1",
    "162.159.195.1",
    "162.159.192.2",
    "162.159.193.2",
    "162.159.195.2",
    "162.159.192.5",
    "162.159.193.5",
    "162.159.192.10",
]

COMMON_PORTS = [2408, 500, 4500, 1701, 854]
