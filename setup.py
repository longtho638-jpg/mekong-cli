from setuptools import find_packages, setup

setup(
    name="mekong-cli",
    version="0.2.0",
    description="Agency OS CLI - The Ultimate Agency Operating System",
    author="Antigravity Team",
    packages=find_packages(exclude=["tests", "docs", "plans", "scripts"]),
    install_requires=[
        "typer>=0.9.0",
        "rich>=13.0.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "pydantic>=2.0.0",
        "requests>=2.31.0",
        "httpx>=0.24.0",
        "python-dotenv>=1.0.0",
        "google-genai>=0.3.0",
        "pydantic-settings>=2.0.0",
    ],
    entry_points={
        "console_scripts": [
            "mekong=cli.entrypoint:main",
        ],
    },
    python_requires=">=3.9",
)
