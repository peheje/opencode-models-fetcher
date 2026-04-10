# Poe Models Config Generator

Fetch latest Poe models and generate an `opencode` config file.

## Usage

```bash
bun run poe-models-config.ts --key <POE_API_KEY> [options]
```

### Options
- `-k, --key <API_KEY>`: Poe API key (required)
- `-o, --output <PATH>`: Output path (default: `~/.config/opencode/opencode.jsonc`)
- `-h, --help`: Show help message
