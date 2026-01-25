#!/usr/bin/env python3
"""
CC Monitor - System Monitoring CLI for Antigravity/Mekong CLI

Commands:
  health   - System health check (API, DB, services)
  alerts   - Show recent alerts
  logs     - Stream system logs
  metrics  - Performance metrics (CPU, memory, requests)
  uptime   - Uptime report

Usage:
  python scripts/cc_monitor.py health
  python scripts/cc_monitor.py alerts [--limit N]
  python scripts/cc_monitor.py logs tail [--lines N] [--follow]
  python scripts/cc_monitor.py metrics [--interval SECONDS]
  python scripts/cc_monitor.py uptime
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import psutil


class Colors:
    """ANSI color codes for terminal output"""
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    BOLD = "\033[1m"
    DIM = "\033[2m"


class CCMonitor:
    """System monitoring CLI for CC operations"""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or Path.cwd()
        self.logs_dir = self.base_dir / "logs"
        self.metrics_dir = self.base_dir / ".cache" / "metrics"
        self.alerts_file = self.logs_dir / "alerts.jsonl"
        self.uptime_file = self.base_dir / ".cache" / "uptime.json"

        # Ensure directories exist
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)

    def health_check(self) -> Dict[str, Any]:
        """
        Run comprehensive system health check

        Returns:
            Dict with health status of all components
        """
        print(f"{Colors.BOLD}🏥 System Health Check{Colors.RESET}\n")

        results = {
            "timestamp": datetime.now().isoformat(),
            "overall": "healthy",
            "components": {}
        }

        # Check Python environment
        python_status = self._check_python()
        results["components"]["python"] = python_status
        self._print_component("Python Environment", python_status)

        # Check disk space
        disk_status = self._check_disk()
        results["components"]["disk"] = disk_status
        self._print_component("Disk Space", disk_status)

        # Check memory
        memory_status = self._check_memory()
        results["components"]["memory"] = memory_status
        self._print_component("Memory", memory_status)

        # Check key services/processes
        services_status = self._check_services()
        results["components"]["services"] = services_status
        self._print_component("Services", services_status)

        # Check log files
        logs_status = self._check_logs()
        results["components"]["logs"] = logs_status
        self._print_component("Logs", logs_status)

        # Determine overall health
        if any(c["status"] == "critical" for c in results["components"].values()):
            results["overall"] = "critical"
        elif any(c["status"] == "warning" for c in results["components"].values()):
            results["overall"] = "warning"

        # Print summary
        print(f"\n{Colors.BOLD}Overall Status:{Colors.RESET} ", end="")
        if results["overall"] == "healthy":
            print(f"{Colors.GREEN}✓ HEALTHY{Colors.RESET}")
        elif results["overall"] == "warning":
            print(f"{Colors.YELLOW}⚠ WARNING{Colors.RESET}")
        else:
            print(f"{Colors.RED}✗ CRITICAL{Colors.RESET}")

        return results

    def _check_python(self) -> Dict[str, Any]:
        """Check Python environment"""
        try:
            version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            return {
                "status": "healthy",
                "version": version,
                "executable": sys.executable
            }
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }

    def _check_disk(self) -> Dict[str, Any]:
        """Check disk space"""
        try:
            usage = psutil.disk_usage(str(self.base_dir))
            percent_used = usage.percent

            if percent_used > 90:
                status = "critical"
            elif percent_used > 80:
                status = "warning"
            else:
                status = "healthy"

            return {
                "status": status,
                "total_gb": round(usage.total / (1024**3), 2),
                "used_gb": round(usage.used / (1024**3), 2),
                "free_gb": round(usage.free / (1024**3), 2),
                "percent_used": percent_used
            }
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }

    def _check_memory(self) -> Dict[str, Any]:
        """Check memory usage"""
        try:
            mem = psutil.virtual_memory()
            percent_used = mem.percent

            if percent_used > 90:
                status = "critical"
            elif percent_used > 80:
                status = "warning"
            else:
                status = "healthy"

            return {
                "status": status,
                "total_gb": round(mem.total / (1024**3), 2),
                "available_gb": round(mem.available / (1024**3), 2),
                "percent_used": percent_used
            }
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }

    def _check_services(self) -> Dict[str, Any]:
        """Check key services/processes"""
        services = {
            "status": "healthy",
            "processes": []
        }

        # Check for key processes (customize based on your stack)
        key_processes = ["python", "node", "postgres", "redis"]

        for proc_name in key_processes:
            count = 0
            for proc in psutil.process_iter(['name']):
                try:
                    if proc_name in proc.info['name'].lower():
                        count += 1
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            services["processes"].append({
                "name": proc_name,
                "count": count,
                "running": count > 0
            })

        return services

    def _check_logs(self) -> Dict[str, Any]:
        """Check log files health"""
        try:
            if not self.logs_dir.exists():
                return {
                    "status": "warning",
                    "message": "Logs directory does not exist"
                }

            log_files = list(self.logs_dir.glob("*.log"))
            total_size = sum(f.stat().st_size for f in log_files)

            # Warn if logs are over 1GB
            status = "warning" if total_size > 1024**3 else "healthy"

            return {
                "status": status,
                "files_count": len(log_files),
                "total_size_mb": round(total_size / (1024**2), 2)
            }
        except Exception as e:
            return {
                "status": "critical",
                "error": str(e)
            }

    def _print_component(self, name: str, status: Dict[str, Any]):
        """Print component status with color coding"""
        status_str = status["status"]

        if status_str == "healthy":
            icon = f"{Colors.GREEN}✓{Colors.RESET}"
        elif status_str == "warning":
            icon = f"{Colors.YELLOW}⚠{Colors.RESET}"
        else:
            icon = f"{Colors.RED}✗{Colors.RESET}"

        print(f"{icon} {Colors.BOLD}{name}{Colors.RESET}")

        for key, value in status.items():
            if key != "status":
                print(f"  {Colors.DIM}{key}:{Colors.RESET} {value}")
        print()

    def show_alerts(self, limit: int = 10):
        """
        Show recent alerts

        Args:
            limit: Maximum number of alerts to show
        """
        print(f"{Colors.BOLD}🚨 Recent Alerts (last {limit}){Colors.RESET}\n")

        if not self.alerts_file.exists():
            print(f"{Colors.DIM}No alerts found{Colors.RESET}")
            return

        try:
            alerts = []
            with open(self.alerts_file, 'r') as f:
                for line in f:
                    try:
                        alerts.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue

            # Show most recent alerts
            alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)

            if not alerts:
                print(f"{Colors.DIM}No alerts found{Colors.RESET}")
                return

            for alert in alerts[:limit]:
                severity = alert.get('severity', 'info')
                timestamp = alert.get('timestamp', 'unknown')
                message = alert.get('message', 'No message')
                source = alert.get('source', 'unknown')

                # Color code by severity
                if severity == 'critical':
                    color = Colors.RED
                elif severity == 'warning':
                    color = Colors.YELLOW
                else:
                    color = Colors.BLUE

                print(f"{color}[{severity.upper()}]{Colors.RESET} {timestamp}")
                print(f"  {Colors.BOLD}{message}{Colors.RESET}")
                print(f"  {Colors.DIM}Source: {source}{Colors.RESET}\n")

        except Exception as e:
            print(f"{Colors.RED}Error reading alerts: {e}{Colors.RESET}")

    def tail_logs(self, lines: int = 50, follow: bool = False):
        """
        Tail system logs

        Args:
            lines: Number of lines to show
            follow: Whether to follow log updates
        """
        log_file = self.logs_dir / "system.log"

        if not log_file.exists():
            print(f"{Colors.YELLOW}⚠ Log file not found: {log_file}{Colors.RESET}")
            print(f"{Colors.DIM}Creating log file...{Colors.RESET}")
            log_file.touch()

        print(f"{Colors.BOLD}📜 System Logs (last {lines} lines){Colors.RESET}\n")

        try:
            if follow:
                # Use subprocess to tail -f
                subprocess.run(['tail', '-f', '-n', str(lines), str(log_file)])
            else:
                # Read last N lines
                with open(log_file, 'r') as f:
                    all_lines = f.readlines()
                    for line in all_lines[-lines:]:
                        # Color code log levels
                        if 'ERROR' in line or 'CRITICAL' in line:
                            print(f"{Colors.RED}{line.rstrip()}{Colors.RESET}")
                        elif 'WARNING' in line:
                            print(f"{Colors.YELLOW}{line.rstrip()}{Colors.RESET}")
                        elif 'INFO' in line:
                            print(f"{Colors.BLUE}{line.rstrip()}{Colors.RESET}")
                        else:
                            print(line.rstrip())

        except Exception as e:
            print(f"{Colors.RED}Error reading logs: {e}{Colors.RESET}")

    def show_metrics(self, interval: Optional[int] = None):
        """
        Show performance metrics

        Args:
            interval: If set, refresh metrics every N seconds
        """
        try:
            while True:
                # Clear screen for refresh
                if interval:
                    os.system('clear' if os.name != 'nt' else 'cls')

                print(f"{Colors.BOLD}📊 Performance Metrics{Colors.RESET}")
                print(f"{Colors.DIM}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}\n")

                # CPU metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                cpu_count = psutil.cpu_count()
                print(f"{Colors.BOLD}CPU:{Colors.RESET}")
                print(f"  Usage: {self._colorize_percent(cpu_percent)}%")
                print(f"  Cores: {cpu_count}")
                print()

                # Memory metrics
                mem = psutil.virtual_memory()
                print(f"{Colors.BOLD}Memory:{Colors.RESET}")
                print(f"  Total: {round(mem.total / (1024**3), 2)} GB")
                print(f"  Available: {round(mem.available / (1024**3), 2)} GB")
                print(f"  Used: {self._colorize_percent(mem.percent)}%")
                print()

                # Disk metrics
                disk = psutil.disk_usage(str(self.base_dir))
                print(f"{Colors.BOLD}Disk:{Colors.RESET}")
                print(f"  Total: {round(disk.total / (1024**3), 2)} GB")
                print(f"  Free: {round(disk.free / (1024**3), 2)} GB")
                print(f"  Used: {self._colorize_percent(disk.percent)}%")
                print()

                # Network metrics
                net = psutil.net_io_counters()
                print(f"{Colors.BOLD}Network:{Colors.RESET}")
                print(f"  Sent: {round(net.bytes_sent / (1024**2), 2)} MB")
                print(f"  Received: {round(net.bytes_recv / (1024**2), 2)} MB")
                print()

                # Process count
                proc_count = len(psutil.pids())
                print(f"{Colors.BOLD}Processes:{Colors.RESET} {proc_count}")

                if not interval:
                    break

                print(f"\n{Colors.DIM}Refreshing every {interval}s... (Ctrl+C to exit){Colors.RESET}")
                time.sleep(interval)

        except KeyboardInterrupt:
            print(f"\n{Colors.DIM}Monitoring stopped{Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}Error collecting metrics: {e}{Colors.RESET}")

    def _colorize_percent(self, percent: float) -> str:
        """Colorize percentage based on thresholds"""
        if percent > 90:
            return f"{Colors.RED}{percent}{Colors.RESET}"
        elif percent > 80:
            return f"{Colors.YELLOW}{percent}{Colors.RESET}"
        else:
            return f"{Colors.GREEN}{percent}{Colors.RESET}"

    def show_uptime(self):
        """Show system uptime report"""
        print(f"{Colors.BOLD}⏱️  Uptime Report{Colors.RESET}\n")

        try:
            # System boot time
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime_duration = datetime.now() - boot_time

            print(f"{Colors.BOLD}System:{Colors.RESET}")
            print(f"  Boot Time: {boot_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"  Uptime: {self._format_duration(uptime_duration)}")
            print()

            # Application uptime (if tracked)
            if self.uptime_file.exists():
                with open(self.uptime_file, 'r') as f:
                    uptime_data = json.load(f)

                app_start = datetime.fromisoformat(uptime_data.get('start_time', datetime.now().isoformat()))
                app_uptime = datetime.now() - app_start

                print(f"{Colors.BOLD}Application:{Colors.RESET}")
                print(f"  Start Time: {app_start.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"  Uptime: {self._format_duration(app_uptime)}")
                print(f"  Restarts: {uptime_data.get('restart_count', 0)}")
                print()

            # Load averages (Unix-like systems only)
            if hasattr(os, 'getloadavg'):
                load1, load5, load15 = os.getloadavg()
                print(f"{Colors.BOLD}Load Average:{Colors.RESET}")
                print(f"  1 min:  {load1:.2f}")
                print(f"  5 min:  {load5:.2f}")
                print(f"  15 min: {load15:.2f}")

        except Exception as e:
            print(f"{Colors.RED}Error getting uptime: {e}{Colors.RESET}")

    def _format_duration(self, duration: timedelta) -> str:
        """Format timedelta as human-readable string"""
        days = duration.days
        hours, remainder = divmod(duration.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if seconds > 0 or not parts:
            parts.append(f"{seconds}s")

        return " ".join(parts)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="CC Monitor - System Monitoring CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/cc_monitor.py health
  python scripts/cc_monitor.py alerts --limit 20
  python scripts/cc_monitor.py logs tail --lines 100 --follow
  python scripts/cc_monitor.py metrics --interval 5
  python scripts/cc_monitor.py uptime
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Health command
    subparsers.add_parser('health', help='Run system health check')

    # Alerts command
    alerts_parser = subparsers.add_parser('alerts', help='Show recent alerts')
    alerts_parser.add_argument('--limit', type=int, default=10, help='Number of alerts to show')

    # Logs command
    logs_parser = subparsers.add_parser('logs', help='View system logs')
    logs_subparsers = logs_parser.add_subparsers(dest='logs_command')

    tail_parser = logs_subparsers.add_parser('tail', help='Tail log files')
    tail_parser.add_argument('--lines', type=int, default=50, help='Number of lines to show')
    tail_parser.add_argument('--follow', '-f', action='store_true', help='Follow log updates')

    # Metrics command
    metrics_parser = subparsers.add_parser('metrics', help='Show performance metrics')
    metrics_parser.add_argument('--interval', type=int, help='Refresh interval in seconds')

    # Uptime command
    subparsers.add_parser('uptime', help='Show uptime report')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Initialize monitor
    monitor = CCMonitor()

    # Execute command
    try:
        if args.command == 'health':
            monitor.health_check()

        elif args.command == 'alerts':
            monitor.show_alerts(limit=args.limit)

        elif args.command == 'logs':
            if args.logs_command == 'tail':
                monitor.tail_logs(lines=args.lines, follow=args.follow)
            else:
                logs_parser.print_help()

        elif args.command == 'metrics':
            monitor.show_metrics(interval=args.interval)

        elif args.command == 'uptime':
            monitor.show_uptime()

        return 0

    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.RESET}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
