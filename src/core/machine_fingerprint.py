"""
Machine Fingerprint — Platform-Specific Hardware Identifiers

Generates unique machine fingerprints using hardware-specific identifiers:
- macOS: MAC address + disk serial + Secure Enclave (if available)
- Linux: MAC address + disk serial + machine-id
- Windows: MAC address + disk serial + machine GUID

Fingerprint used for license binding and device identification.
"""

import hashlib
import platform
import subprocess
import uuid
from dataclasses import dataclass, field
from typing import Optional, List
from pathlib import Path


@dataclass
class MachineFingerprint:
    """
    Machine fingerprint data structure.

    Combines multiple hardware identifiers for stable, unique fingerprint.
    """

    mac_addresses: List[str] = field(default_factory=list)
    disk_serial: Optional[str] = None
    machine_id: Optional[str] = None
    platform: str = field(default_factory=lambda: platform.system())
    platform_version: str = field(default_factory=lambda: platform.version())
    architecture: str = field(default_factory=lambda: platform.machine())

    @property
    def fingerprint_hash(self) -> str:
        """Generate SHA-256 fingerprint hash from all identifiers."""
        # Combine all identifiers
        components = []

        # MAC addresses (sorted for consistency)
        for mac in sorted(self.mac_addresses):
            components.append(f"mac:{mac}")

        # Disk serial
        if self.disk_serial:
            components.append(f"disk:{self.disk_serial}")

        # Machine ID
        if self.machine_id:
            components.append(f"machine:{self.machine_id}")

        # Platform info
        components.append(f"os:{self.platform}:{self.platform_version}:{self.architecture}")

        # Generate hash
        combined = "|".join(components)
        return hashlib.sha256(combined.encode()).hexdigest()

    @property
    def short_fingerprint(self) -> str:
        """Get short fingerprint (first 16 chars)."""
        return self.fingerprint_hash[:16]

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "mac_addresses": self.mac_addresses,
            "disk_serial": self.disk_serial,
            "machine_id": self.machine_id,
            "platform": self.platform,
            "platform_version": self.platform_version,
            "architecture": self.architecture,
            "fingerprint_hash": self.fingerprint_hash,
            "short_fingerprint": self.short_fingerprint,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MachineFingerprint":
        """Deserialize from dictionary."""
        # Only use actual fields, not computed properties
        return cls(
            mac_addresses=data.get("mac_addresses", []),
            disk_serial=data.get("disk_serial"),
            machine_id=data.get("machine_id"),
            platform=data.get("platform", platform.system()),
            platform_version=data.get("platform_version", platform.version()),
            architecture=data.get("architecture", platform.machine()),
        )


class FingerprintGenerator:
    """
    Generates machine fingerprints using platform-specific methods.
    """

    def __init__(self):
        self.platform = platform.system()

    def generate(self) -> MachineFingerprint:
        """Generate machine fingerprint."""
        fingerprint = MachineFingerprint(
            platform=self.platform,
            platform_version=platform.version(),
            architecture=platform.machine(),
        )

        # Get MAC addresses
        fingerprint.mac_addresses = self._get_mac_addresses()

        # Get disk serial
        fingerprint.disk_serial = self._get_disk_serial()

        # Get machine ID
        fingerprint.machine_id = self._get_machine_id()

        return fingerprint

    def _get_mac_addresses(self) -> List[str]:
        """
        Get MAC addresses from all network interfaces.

        Returns sorted list of MAC addresses (excluding loopback).
        """
        mac_addresses = []

        try:
            if self.platform == "Darwin":  # macOS
                mac_addresses = self._get_mac_addresses_macos()
            elif self.platform == "Linux":
                mac_addresses = self._get_mac_addresses_linux()
            elif self.platform == "Windows":
                mac_addresses = self._get_mac_addresses_windows()
            else:
                # Fallback: use UUID
                mac_addresses = [str(uuid.uuid4())]
        except Exception:
            # Ultimate fallback
            mac_addresses = [str(uuid.getnode())]

        # Filter out empty and loopback addresses
        mac_addresses = [
            mac for mac in mac_addresses
            if mac and mac != "00:00:00:00:00:00"
        ]

        return sorted(set(mac_addresses))

    def _get_mac_addresses_macos(self) -> List[str]:
        """Get MAC addresses on macOS."""
        mac_addresses = []

        try:
            # Use networksetup to get MAC addresses
            result = subprocess.run(
                ["networksetup", "-listallhardwareports"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                # Parse output
                for line in result.stdout.split("\n"):
                    if "Ethernet Address:" in line:
                        mac = line.split(":")[1].strip()
                        mac_addresses.append(mac.lower())
        except Exception:
            pass

        # Fallback: use ifconfig
        if not mac_addresses:
            try:
                result = subprocess.run(
                    ["ifconfig", "-a"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                for line in result.stdout.split("\n"):
                    if "ether" in line:
                        mac = line.split()[1].strip()
                        mac_addresses.append(mac.lower())
            except Exception:
                pass

        return mac_addresses if mac_addresses else [str(uuid.getnode())]

    def _get_mac_addresses_linux(self) -> List[str]:
        """Get MAC addresses on Linux."""
        mac_addresses = []

        try:
            # Read from /sys/class/net
            net_path = Path("/sys/class/net")
            if net_path.exists():
                for iface in net_path.iterdir():
                    if iface.name == "lo":  # Skip loopback
                        continue
                    address_file = iface / "address"
                    if address_file.exists():
                        with open(address_file, "r") as f:
                            mac = f.read().strip().lower()
                            if mac and mac != "00:00:00:00:00:00":
                                mac_addresses.append(mac)
        except Exception:
            pass

        # Fallback: use ip command
        if not mac_addresses:
            try:
                result = subprocess.run(
                    ["ip", "link"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                for line in result.stdout.split("\n"):
                    if "link/ether" in line:
                        mac = line.split()[1].strip().lower()
                        mac_addresses.append(mac)
            except Exception:
                pass

        return mac_addresses if mac_addresses else [str(uuid.getnode())]

    def _get_mac_addresses_windows(self) -> List[str]:
        """Get MAC addresses on Windows."""
        mac_addresses = []

        try:
            # Use PowerShell to get MAC addresses
            result = subprocess.run(
                ["powershell", "-Command",
                 "Get-NetAdapter -Physical | Select-Object -ExpandProperty MacAddress"],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    mac = line.strip().replace("-", ":").lower()
                    if mac and mac != "00:00:00:00:00:00":
                        mac_addresses.append(mac)
        except Exception:
            pass

        # Fallback: use ipconfig
        if not mac_addresses:
            try:
                result = subprocess.run(
                    ["ipconfig", "/all"],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )

                for line in result.stdout.split("\n"):
                    if "Physical Address" in line:
                        mac = line.split(":")[1].strip().replace("-", ":").lower()
                        if mac:
                            mac_addresses.append(mac)
            except Exception:
                pass

        return mac_addresses if mac_addresses else [str(uuid.getnode())]

    def _get_disk_serial(self) -> Optional[str]:
        """Get disk serial number."""
        try:
            if self.platform == "Darwin":  # macOS
                return self._get_disk_serial_macos()
            elif self.platform == "Linux":
                return self._get_disk_serial_linux()
            elif self.platform == "Windows":
                return self._get_disk_serial_windows()
        except Exception:
            pass

        return None

    def _get_disk_serial_macos(self) -> Optional[str]:
        """Get disk serial on macOS."""
        try:
            result = subprocess.run(
                ["diskutil", "info", "/"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                for line in result.stdout.split("\n"):
                    if "Device/Series Number" in line or "Serial Number" in line:
                        serial = line.split(":")[1].strip()
                        if serial:
                            return serial.lower()
        except Exception:
            pass

        return None

    def _get_disk_serial_linux(self) -> Optional[str]:
        """Get disk serial on Linux."""
        try:
            # Try to read from /dev/disk/by-id
            disk_by_id = Path("/dev/disk/by-id")
            if disk_by_id.exists():
                for entry in disk_by_id.iterdir():
                    if entry.is_symlink() and "ata" in entry.name.lower():
                        # Extract serial from symlink name
                        serial = entry.name.split("_")[-1] if "_" in entry.name else entry.name
                        return serial.lower()

            # Fallback: use hdparm
            result = subprocess.run(
                ["hdparm", "-I", "/dev/sda"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                for line in result.stdout.split("\n"):
                    if "Serial Number" in line:
                        serial = line.split(":")[1].strip()
                        return serial.lower()
        except Exception:
            pass

        # Fallback: read from /sys/block
        try:
            for disk in ["sda", "nvme0n1", "vda"]:
                serial_file = Path(f"/sys/block/{disk}/device/serial")
                if serial_file.exists():
                    with open(serial_file, "r") as f:
                        return f.read().strip().lower()
        except Exception:
            pass

        return None

    def _get_disk_serial_windows(self) -> Optional[str]:
        """Get disk serial on Windows."""
        try:
            result = subprocess.run(
                ["powershell", "-Command",
                 "Get-PhysicalDisk | Select-Object -First 1 -ExpandProperty SerialNumber"],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().lower()
        except Exception:
            pass

        # Fallback: use wmic
        try:
            result = subprocess.run(
                ["wmic", "diskdrive", "get", "serialnumber"],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            if result.returncode == 0:
                lines = result.stdout.strip().split("\n")
                if len(lines) > 1:
                    return lines[1].strip().lower()
        except Exception:
            pass

        return None

    def _get_machine_id(self) -> Optional[str]:
        """Get machine-specific ID."""
        try:
            if self.platform == "Darwin":  # macOS
                return self._get_machine_id_macos()
            elif self.platform == "Linux":
                return self._get_machine_id_linux()
            elif self.platform == "Windows":
                return self._get_machine_id_windows()
        except Exception:
            pass

        return None

    def _get_machine_id_macos(self) -> Optional[str]:
        """Get machine ID on macOS (IOPlatformExpertDevice)."""
        try:
            result = subprocess.run(
                ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                for line in result.stdout.split("\n"):
                    if "IOPlatformUUID" in line:
                        uuid = line.split('"')[1] if '"' in line else None
                        return uuid.lower() if uuid else None
        except Exception:
            pass

        return None

    def _get_machine_id_linux(self) -> Optional[str]:
        """Get machine ID on Linux (machine-id)."""
        try:
            # Try /etc/machine-id first
            machine_id_file = Path("/etc/machine-id")
            if machine_id_file.exists():
                with open(machine_id_file, "r") as f:
                    return f.read().strip().lower()

            # Fallback to /var/lib/dbus/machine-id
            dbus_machine_id = Path("/var/lib/dbus/machine-id")
            if dbus_machine_id.exists():
                with open(dbus_machine_id, "r") as f:
                    return f.read().strip().lower()
        except Exception:
            pass

        return None

    def _get_machine_id_windows(self) -> Optional[str]:
        """Get machine ID on Windows (registry)."""
        try:
            result = subprocess.run(
                ["powershell", "-Command",
                 "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' | "
                 "Select-Object -ExpandProperty MachineGuid"],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip().lower()
        except Exception:
            pass

        return None


# Global instance
_fingerprint_generator: Optional[FingerprintGenerator] = None


def get_fingerprint_generator() -> FingerprintGenerator:
    """Get global fingerprint generator instance."""
    global _fingerprint_generator
    if _fingerprint_generator is None:
        _fingerprint_generator = FingerprintGenerator()
    return _fingerprint_generator


def get_machine_fingerprint() -> MachineFingerprint:
    """Get machine fingerprint."""
    return get_fingerprint_generator().generate()


def get_machine_fingerprint_hash() -> str:
    """Get machine fingerprint hash."""
    return get_machine_fingerprint().fingerprint_hash


def get_short_fingerprint() -> str:
    """Get short machine fingerprint (16 chars)."""
    return get_machine_fingerprint().short_fingerprint
