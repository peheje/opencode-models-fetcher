# OpenCode Models Fetcher

Fetch model lists and generate `opencode` config files.

## OpenRouter

```bash
bun run openrouter-models-config.ts
```

This writes `opencode.openrouter.jsonc` with the latest OpenRouter models from:

```text
https://openrouter.ai/api/v1/models
```

Install or update the OpenRouter model list in your local OpenCode config:

```bash
bun run openrouter-models-config.ts --install
```

Set a default model while installing:

```bash
bun run openrouter-models-config.ts --install --default-model deepseek/deepseek-v4-pro
```

The install command updates `provider.openrouter.models` in:

```text
~/.config/opencode/opencode.jsonc
```

### OpenRouter Options

- `-o, --output <PATH>`: Generated config output path (default: `opencode.openrouter.jsonc`)
- `-i, --install`: Install/update `provider.openrouter.models` in OpenCode config
- `--install-path <PATH>`: OpenCode config path (default: `~/.config/opencode/opencode.jsonc`)
- `--default-model <ID>`: Set the default model using an OpenRouter model ID, without the `openrouter/` prefix
- `-h, --help`: Show help message

## Poe

The existing Poe generator is still available:

```bash
bun run poe-models-config.ts [options]
```

### Poe Options

- `-o, --output <PATH>`: Output config path (default: `~/.config/opencode/opencode.jsonc`)
- `-S, --serious`: Only include models from selected AI labs
- `-h, --help`: Show help message

## Package Scripts

```bash
bun run update:openrouter
bun run install:openrouter
bun run update:poe
```
