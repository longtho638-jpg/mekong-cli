import os
import sys
import platform
import psutil
import speedtest
import time
import subprocess
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich import print as rprint
import questionary

console = Console()

def clear_screen():
    # Safer alternative to os.system using subprocess
    command = 'cls' if os.name == 'nt' else 'clear'
    subprocess.run([command], shell=False)

def print_header():
    console.clear() # Use rich console clear which is cross-platform
    rprint(Panel.fit(
        "[bold gold1]🏯 ANTIGRAVITY ONBOARDING WIZARD[/bold gold1]\n"
        "[italic cyan]Hệ điều hành Agency OS - Phiên bản Iron Man[/italic cyan]",
        border_style="gold1"
    ))

def check_system():
    rprint("\n[bold blue]🔍 BƯỚC 1: THỦY KẾ (SYSTEM CHECK)[/bold blue]")

    # OS
    os_name = platform.system()
    os_ver = platform.release()
    rprint(f"🖥️  Hệ điều hành: [green]{os_name} {os_ver}[/green]")

    # RAM
    ram = psutil.virtual_memory()
    ram_gb = round(ram.total / (1024**3), 1)
    ram_color = "green" if ram_gb >= 16 else "yellow" if ram_gb >= 8 else "red"
    rprint(f"💾 RAM: [{ram_color}]{ram_gb} GB[/{ram_color}] (Khuyến nghị: 16GB+)")

    # CPU
    cpu_cores = psutil.cpu_count()
    rprint(f"🧠 CPU: [green]{cpu_cores} Cores[/green]")

    return ram_gb

def check_network():
    rprint("\n[bold blue]📡 BƯỚC 2: THIÊN THỜI (NETWORK CHECK)[/bold blue]")
    rprint("[italic dim]Đang đo tốc độ mạng... vui lòng đợi...[/italic dim]")

    try:
        st = speedtest.Speedtest()
        st.get_best_server()

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Đang download test...", total=None)
            download_speed = st.download() / 1_000_000  # Mbps

            progress.add_task(description="Đang upload test...", total=None)
            upload_speed = st.upload() / 1_000_000  # Mbps

            ping = st.results.ping

        color = "green" if download_speed > 50 else "yellow" if download_speed > 30 else "red"

        table = Table(show_header=False, box=None)
        table.add_row("Download", f"[{color}]{download_speed:.1f} Mbps[/{color}]")
        table.add_row("Upload", f"{upload_speed:.1f} Mbps")
        table.add_row("Ping", f"{ping:.0f} ms")

        console.print(table)

        if download_speed < 30:
            rprint("\n[bold red]⚠️  CẢNH BÁO:[/bold red] Mạng yếu. Hãy cân nhắc dùng LAN cable hoặc nâng cấp gói cước.")

    except Exception as e:
        rprint(f"[red]❌ Không thể kiểm tra mạng: {str(e)}[/red]")

def installation_guide():
    rprint("\n[bold blue]⚙️  BƯỚC 3: ĐỊA LỢI (ENVIRONMENT SETUP)[/bold blue]")

    actions = [
        "Cài đặt Homebrew (Package Manager)",
        "Cài đặt Node.js & Python",
        "Cài đặt VSCode & Extensions",
        "Cấu hình Antigravity Proxy (WARP)"
    ]

    selected = questionary.checkbox(
        "Chọn các thành phần cần cài đặt:",
        choices=actions,
        instruction="(Dùng phím cách để chọn)"
    ).ask()

    if selected:
        rprint("\n[bold green]🚀 Đang khởi chạy quy trình cài đặt tự động...[/bold green]")

        # Determine script path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        setup_script = os.path.join(script_dir, "setup-antigravity.sh")

        if os.path.exists(setup_script):
            try:
                # Use subprocess to run the shell script
                subprocess.call([setup_script], shell=True)
                rprint("✅ Cài đặt hoàn tất!")
            except Exception as e:
                rprint(f"[red]❌ Lỗi khi chạy script: {str(e)}[/red]")
        else:
            rprint(f"[yellow]⚠️  Không tìm thấy script cài đặt tại: {setup_script}[/yellow]")
            rprint("[dim](Đảm bảo setup-antigravity.sh nằm cùng thư mục với wizard)[/dim]")
    else:
        rprint("\n[yellow]⚠️  Bạn đã bỏ qua bước cài đặt.[/yellow]")

def final_briefing():
    rprint("\n[bold blue]🏆 BƯỚC 4: XUẤT QUÂN (DEPLOYMENT)[/bold blue]")
    rprint(Panel(
        "Chúc mừng Tư Lệnh! Hệ thống đã sẵn sàng.\n\n"
        "👉 Lệnh tiếp theo: [bold cyan]cc revenue dashboard[/bold cyan]\n"
        "👉 Nhiệm vụ: Generate $1,000 đầu tiên\n"
        "👉 Cộng đồng: https://antigravity.vn/community",
        title="READY FOR COMBAT",
        border_style="green"
    ))

def main():
    print_header()

    if not Confirm.ask("Bạn đã sẵn sàng kiểm tra hệ thống chưa?"):
        rprint("[bold red]Đã hủy chiến dịch.[/bold red]")
        sys.exit()

    ram = check_system()
    check_network()

    if ram < 8:
        rprint("\n[bold red]⛔ CẢNH BÁO NGHIÊM TRỌNG:[/bold red] RAM < 8GB sẽ gây lag khi chạy AI Agent.")
        if not Confirm.ask("Bạn có muốn tiếp tục không?"):
            sys.exit()

    installation_guide()
    final_briefing()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        rprint("\n[bold red]Đã hủy bỏ.[/bold red]")
        sys.exit()
