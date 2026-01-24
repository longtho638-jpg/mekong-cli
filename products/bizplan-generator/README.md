# BizPlan Generator AI

AI-powered business plan generator using Google Gemini. Create comprehensive business plans in minutes.

## Features

- **Intelligent Plan Generation**: Leverages Google Gemini AI for context-aware business planning
- **Comprehensive Sections**: Generates all key business plan components
- **Markdown Output**: Professional, structured markdown format
- **CLI Interface**: Simple command-line tool for quick generation

## Prerequisites

- Python 3.8 or higher
- Google AI Studio API key (get one at https://aistudio.google.com/app/apikey)

## Installation

1. **Extract the package**
   ```bash
   unzip bizplan-generator.zip
   cd bizplan-generator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API key**
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

## Usage

### Basic Usage

```bash
python bizplan_cli.py "Your startup idea here"
```

### Example

```bash
python bizplan_cli.py "A SaaS platform for AI-powered project management"
```

This will generate a markdown file with your business plan in the current directory.

### Options

```bash
python bizplan_cli.py --help
```

Available options:
- `--output` or `-o`: Specify output file path
- `--model`: Choose Gemini model (default: gemini-2.0-flash-exp)

## Generated Business Plan Structure

The tool generates a comprehensive business plan including:

1. **Executive Summary**: Overview of your business concept
2. **Company Description**: Mission, vision, and value proposition
3. **Market Analysis**: Target market and competitive landscape
4. **Organization & Management**: Team structure and key roles
5. **Products & Services**: Detailed offering descriptions
6. **Marketing Strategy**: Customer acquisition and growth plans
7. **Financial Projections**: Revenue models and funding requirements

## Troubleshooting

### API Key Issues

If you see authentication errors:
1. Verify your API key in `.env` file
2. Check your API key is active at https://aistudio.google.com/app/apikey
3. Ensure no extra spaces or quotes in the `.env` file

### Import Errors

If you get module import errors:
```bash
pip install --upgrade -r requirements.txt
```

## Support

For issues or questions:
- Email: support@binhphap.studio
- Documentation: Included in package

## License

Commercial License - See LICENSE.md for details.

## Credits

Developed by Binh Pháp Venture Studio
Powered by Google Gemini AI
