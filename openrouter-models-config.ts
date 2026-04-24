#!/usr/bin/env bun

import { dirname, resolve } from "node:path"
import { existsSync, mkdirSync } from "node:fs"
import { parseArgs } from "node:util"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"
const DEFAULT_OUTPUT = "opencode.openrouter.jsonc"
const DEFAULT_INSTALL_PATH = "~/.config/opencode/opencode.jsonc"

interface OpenRouterModel {
  id: string
}

interface OpenRouterApiResponse {
  data: OpenRouterModel[]
}

function expandHome(path: string): string {
  return path.replace(/^~(?=$|\/)/, process.env.HOME ?? "")
}

function parseConfig(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content)
  } catch {
    return {}
  }
}

function stringifyJsonc(obj: unknown): string {
  return `${JSON.stringify(obj, null, 2)}\n`
}

async function fetchOpenRouterModels(): Promise<OpenRouterApiResponse> {
  const response = await fetch(OPENROUTER_API_URL)
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<OpenRouterApiResponse>
}

function buildOpenCodeConfig(modelIds: string[]): Record<string, unknown> {
  const models: Record<string, Record<string, never>> = {}
  for (const id of modelIds) {
    models[id] = {}
  }

  return {
    "$schema": "https://opencode.ai/config.json",
    provider: {
      openrouter: {
        models,
      },
    },
  }
}

async function writeConfig(path: string, config: Record<string, unknown>) {
  const expandedPath = expandHome(path)
  mkdirSync(dirname(expandedPath), { recursive: true })
  await Bun.write(expandedPath, stringifyJsonc(config))
  return expandedPath
}

async function installConfig(path: string, modelIds: string[], defaultModel?: string) {
  const expandedPath = expandHome(path)
  let config: Record<string, unknown> = { "$schema": "https://opencode.ai/config.json" }

  if (existsSync(expandedPath)) {
    const content = await Bun.file(expandedPath).text()
    config = {
      "$schema": "https://opencode.ai/config.json",
      ...parseConfig(content),
    }
  }

  const provider = (config.provider as Record<string, unknown> | undefined) ?? {}
  const openrouter = (provider.openrouter as Record<string, unknown> | undefined) ?? {}
  const models: Record<string, Record<string, never>> = {}

  for (const id of modelIds) {
    models[id] = {}
  }

  openrouter.models = models
  provider.openrouter = openrouter
  config.provider = provider

  if (defaultModel) {
    if (!modelIds.includes(defaultModel)) {
      throw new Error(`Default model "${defaultModel}" was not found in the OpenRouter model list`)
    }
    config.model = `openrouter/${defaultModel}`
  }

  return writeConfig(expandedPath, config)
}

async function main() {
  const args = parseArgs({
    options: {
      output: { type: "string", short: "o", default: DEFAULT_OUTPUT },
      install: { type: "boolean", short: "i", default: false },
      "install-path": { type: "string", default: DEFAULT_INSTALL_PATH },
      "default-model": { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  })

  if (args.values.help) {
    console.log(`
OpenRouter Models Config Generator

Usage:
  bun run openrouter-models-config.ts [options]

Options:
  -o, --output <PATH>           Generated config output path (default: opencode.openrouter.jsonc)
  -i, --install                 Install/update provider.openrouter.models in OpenCode config
      --install-path <PATH>     OpenCode config path (default: ~/.config/opencode/opencode.jsonc)
      --default-model <ID>      Set default model, without the openrouter/ prefix
  -h, --help                    Show this help message
`)
    process.exit(0)
  }

  console.log("Fetching models from OpenRouter API...")
  let openrouterData: OpenRouterApiResponse
  try {
    openrouterData = await fetchOpenRouterModels()
  } catch (err) {
    console.error(`Error fetching models: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const modelIds = openrouterData.data.map((model) => model.id)
  console.log(`Found ${modelIds.length} models`)

  const outputPath = resolve(args.values.output!)
  const generatedConfig = buildOpenCodeConfig(modelIds)
  const writtenOutput = await writeConfig(outputPath, generatedConfig)
  console.log(`Config written to ${writtenOutput}`)

  if (args.values.install) {
    const installedPath = await installConfig(
      args.values["install-path"]!,
      modelIds,
      args.values["default-model"],
    )
    console.log(`OpenCode config updated at ${installedPath}`)
  }
}

main()
