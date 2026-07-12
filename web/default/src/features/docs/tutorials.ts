/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  Bot,
  Brain,
  Code2,
  Cpu,
  Download,
  GitBranch,
  Globe,
  Key,
  Layers,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'

import type { DocsTutorialSlug, TutorialDefinition } from '../types'

export const TUTORIALS: Record<DocsTutorialSlug, TutorialDefinition> = {
  codex: {
    slug: 'codex',
    name: 'Codex',
    badgeKey: 'Powered by OpenAI Codex models',
    titleKey: 'Codex CLI configuration tutorial',
    subtitleKey:
      'Install OpenAI Codex CLI and point it at this New API gateway for agentic coding in your terminal.',
    heroGradient: 'from-emerald-500 to-teal-600',
    accentClassName: 'text-emerald-500',
    terminalLines: [
      { text: '$ npm install -g @openai/codex', tone: 'cmd' },
      { text: 'added 1 package in 3s', tone: 'ok' },
      {
        text: '$ export OPENAI_BASE_URL="https://api.wochirou.com/v1"',
        tone: 'cmd',
      },
      { text: '$ codex', tone: 'cmd' },
      { text: 'Codex ready — model provider: newapi', tone: 'info' },
    ],
    features: [
      {
        icon: Cpu,
        titleKey: 'Agentic code edits',
        descriptionKey:
          'Explore the repo, apply multi-file changes, and run commands with an OpenAI coding agent.',
      },
      {
        icon: GitBranch,
        titleKey: 'Git-aware workflow',
        descriptionKey:
          'Review diffs, craft commits, and keep local changes under control while the agent works.',
      },
      {
        icon: Settings,
        titleKey: 'Custom providers',
        descriptionKey:
          'Route traffic through New API with OPENAI_BASE_URL or ~/.codex/config.toml providers.',
      },
      {
        icon: Zap,
        titleKey: 'OpenAI-compatible API',
        descriptionKey:
          'Use the same keys you create in the console — no separate OpenAI account required on the client.',
      },
    ],
    specs: [
      {
        icon: Download,
        titleKey: 'CLI package',
        descriptionKey: 'npm / Homebrew / official installers',
      },
      {
        icon: Cpu,
        titleKey: 'Protocol',
        descriptionKey: 'OpenAI Chat Completions compatible (/v1)',
      },
      {
        icon: Globe,
        titleKey: 'Platforms',
        descriptionKey: 'macOS, Linux, Windows',
      },
    ],
    sections: [
      {
        id: 'install',
        titleKey: 'Install',
        steps: [
          {
            titleKey: 'Install Codex CLI',
            descriptionKey:
              'Pick one installer. Node.js 18+ is required for the npm path.',
            codeBlocks: [
              {
                labelKey: 'npm (global)',
                code: 'npm install -g @openai/codex',
              },
              {
                labelKey: 'Homebrew (macOS)',
                code: 'brew install --cask codex',
              },
              {
                labelKey: 'Official installer (macOS / Linux)',
                code: 'curl -fsSL https://chatgpt.com/codex/install.sh | bash',
              },
            ],
          },
          {
            titleKey: 'Verify the binary',
            codeBlocks: [
              {
                code: 'codex --version\ncodex --help',
              },
            ],
          },
        ],
      },
      {
        id: 'configure',
        titleKey: 'Configure New API',
        steps: [
          {
            titleKey: 'Create an API key',
            descriptionKey:
              'Sign in to this console, open Keys / Tokens, create a key, and copy it once.',
            bulletsKeys: [
              'Prefer a dedicated key for CLI usage',
              'Enable the models you plan to use with Codex',
              'Keep the key out of git and shared screenshots',
            ],
          },
          {
            titleKey: 'Environment variables (quick start)',
            descriptionKey:
              'Point Codex at this gateway with OpenAI-compatible env vars. Replace the key with yours.',
            codeBlocks: [
              {
                labelKey: 'bash / zsh',
                code: `export OPENAI_API_KEY="sk-your-new-api-key"
export OPENAI_BASE_URL="{{OPENAI_BASE_URL}}"
codex`,
              },
              {
                labelKey: 'PowerShell',
                code: `$env:OPENAI_API_KEY = "sk-your-new-api-key"
$env:OPENAI_BASE_URL = "{{OPENAI_BASE_URL}}"
codex`,
              },
            ],
            tipKey:
              'OPENAI_BASE_URL must include the /v1 suffix for OpenAI-compatible gateways.',
          },
          {
            titleKey: 'Codex home directory layout',
            descriptionKey:
              'Codex stores user state under CODEX_HOME (default ~/.codex on macOS/Linux, %USERPROFILE%\\.codex on Windows). Credentials and provider routing are split into separate files.',
            bulletsKeys: [
              '~/.codex/auth.json — cached login / API-key credentials (sensitive)',
              '~/.codex/config.toml — models, providers, sandbox, MCP, and preferences',
              'Project overrides may live in <repo>/.codex/config.toml (trusted projects only)',
              'Do not put secrets in project config or commit them to git',
            ],
            codeBlocks: [
              {
                labelKey: 'Inspect CODEX_HOME',
                code: `echo "\${CODEX_HOME:-$HOME/.codex}"
ls -la "\${CODEX_HOME:-$HOME/.codex}"`,
              },
            ],
          },
        ],
      },
      {
        id: 'auth-json',
        titleKey: 'auth.json',
        steps: [
          {
            titleKey: 'What auth.json is for',
            descriptionKey:
              'Codex never stores API keys inside config.toml. After login or API-key setup, credentials are cached in the OS keyring (preferred) or in ~/.codex/auth.json when file storage is used.',
            bulletsKeys: [
              'auth_mode = "apiKey" — recommended when routing through New API',
              'auth_mode = "chatgpt" — official ChatGPT OAuth tokens (not for custom gateways)',
              'Treat auth.json like a password: mode 600, never commit, never paste into tickets',
              'If you switch from ChatGPT login to a New API key, rewrite auth.json or re-login',
            ],
          },
          {
            titleKey: 'API-key mode for New API (recommended)',
            descriptionKey:
              'Use the key from this console. File-based storage is useful for headless machines and for inspecting what Codex will send.',
            codeBlocks: [
              {
                labelKey: '~/.codex/auth.json',
                code: `{
  "auth_mode": "apiKey",
  "OPENAI_API_KEY": "sk-your-new-api-key"
}`,
              },
              {
                labelKey: 'Create safely (bash)',
                code: `mkdir -p "\${CODEX_HOME:-$HOME/.codex}"
cat > "\${CODEX_HOME:-$HOME/.codex}/auth.json" <<'EOF'
{
  "auth_mode": "apiKey",
  "OPENAI_API_KEY": "sk-your-new-api-key"
}
EOF
chmod 600 "\${CODEX_HOME:-$HOME/.codex}/auth.json"`,
              },
            ],
            tipKey:
              'Prefer env OPENAI_API_KEY + config.toml provider env_key when possible. auth.json is mainly for cached credentials and CI seeding.',
          },
          {
            titleKey: 'ChatGPT OAuth mode (official only)',
            descriptionKey:
              'If you previously ran codex login against ChatGPT, auth.json may look like the example below. This mode talks to OpenAI, not your New API gateway — switch to apiKey mode for gateway routing.',
            codeBlocks: [
              {
                labelKey: 'ChatGPT-style auth.json (do not use with New API)',
                code: `{
  "auth_mode": "chatgpt",
  "OPENAI_API_KEY": null,
  "tokens": {
    "id_token": "...",
    "access_token": "...",
    "refresh_token": "...",
    "account_id": "..."
  },
  "last_refresh": "2026-06-05T18:52:04.551190700Z"
}`,
              },
            ],
          },
          {
            titleKey: 'Choose credential store in config.toml',
            descriptionKey:
              'Control where credentials are written. file forces auth.json; keyring uses the OS secret store; auto prefers keyring when available.',
            codeBlocks: [
              {
                labelKey: 'Snippet for ~/.codex/config.toml',
                code: `# file | keyring | auto
cli_auth_credentials_store = "file"`,
              },
              {
                labelKey: 'Login / logout helpers',
                code: `codex login
# or seed auth.json manually, then:
codex
# clear local credentials when switching accounts
codex logout`,
              },
            ],
          },
        ],
      },
      {
        id: 'config-toml',
        titleKey: 'config.toml',
        steps: [
          {
            titleKey: 'Minimal New API provider config',
            descriptionKey:
              'Recommended daily setup: define a custom model provider that points at this gateway /v1, then select it with model_provider. Keep this in the user config (~/.codex/config.toml), not project config — project files cannot override provider/auth keys.',
            codeBlocks: [
              {
                labelKey: '~/.codex/config.toml',
                code: `# Default model ID must exist on your New API channels
model = "gpt-5.2"
model_provider = "newapi"
model_reasoning_effort = "high"

# Force credentials into auth.json (optional but explicit for gateways)
cli_auth_credentials_store = "file"

[model_providers.newapi]
name = "New API"
base_url = "{{OPENAI_BASE_URL}}"
# Read the key from environment (preferred)
env_key = "OPENAI_API_KEY"
# responses | chat — use responses when your gateway supports the Responses API
wire_api = "responses"
# Set true only if you want Codex ChatGPT/API-key auth instead of env_key
# requires_openai_auth = false`,
              },
            ],
            tipKey:
              'After editing, open a new shell so OPENAI_API_KEY is present, then run: codex',
          },
          {
            titleKey: 'Built-in openai provider override',
            descriptionKey:
              'If you prefer not to define a custom provider id, you can override the built-in openai base URL. Custom [model_providers.*] is still clearer for multi-provider setups.',
            codeBlocks: [
              {
                labelKey: 'Alternative: openai_base_url',
                code: `model = "gpt-5.2"
# Overrides the built-in openai provider endpoint
openai_base_url = "{{OPENAI_BASE_URL}}"

# Still provide the New API key via env or auth.json
# export OPENAI_API_KEY="sk-your-new-api-key"`,
              },
            ],
          },
          {
            titleKey: 'Useful optional keys',
            descriptionKey:
              'These keys are commonly adjusted for gateway and local workflows. Exact defaults depend on your Codex version — check the official config reference if a key is rejected.',
            bulletsKeys: [
              'approval_policy — untrusted | on-request | never',
              'sandbox_mode — read-only | workspace-write | danger-full-access',
              'model_reasoning_effort — minimal | low | medium | high | xhigh',
              'disable_response_storage — avoid uploading conversation storage when unsupported',
              '[features] — experimental feature flags',
              '[mcp_servers.*] — local MCP tool servers',
            ],
            codeBlocks: [
              {
                labelKey: 'Expanded example',
                code: `model = "gpt-5.2"
model_provider = "newapi"
model_reasoning_effort = "high"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
disable_response_storage = true
cli_auth_credentials_store = "file"

[model_providers.newapi]
name = "New API"
base_url = "{{OPENAI_BASE_URL}}"
env_key = "OPENAI_API_KEY"
wire_api = "responses"

[features]
# example flags — enable only what you need
# js_repl = false

# Optional MCP server
# [mcp_servers.context7]
# command = "npx"
# args = ["-y", "@upstash/context7-mcp"]`,
              },
            ],
          },
          {
            titleKey: 'Config precedence and profiles',
            descriptionKey:
              'Closest trusted config wins, but provider/auth keys are restricted to user/system configs for safety.',
            bulletsKeys: [
              'CLI flags / -c overrides win over files',
              'Trusted project .codex/config.toml can set local preferences only',
              'Named profiles: ~/.codex/<name>.config.toml then codex --profile <name>',
              'User ~/.codex/config.toml is the right place for New API base_url + model_provider',
              'System /etc/codex/config.toml and requirements.toml may lock enterprise settings',
            ],
            codeBlocks: [
              {
                labelKey: 'Validate / edit helpers',
                code: `# Open the user config in your editor (if supported by your build)
codex config edit

# One-off override without editing files
codex -c model_provider=newapi -c model='"gpt-5.2"'`,
              },
            ],
          },
        ],
      },
      {
        id: 'usage',
        titleKey: 'Usage',
        steps: [
          {
            titleKey: 'Start in a project directory',
            codeBlocks: [
              {
                code: `cd /path/to/your/project
export OPENAI_API_KEY="sk-your-new-api-key"
codex`,
              },
            ],
          },
          {
            titleKey: 'Useful first prompts',
            bulletsKeys: [
              'Summarize this repository structure',
              'Find the auth middleware and explain the flow',
              'Add unit tests for the quota helper without changing public APIs',
            ],
          },
        ],
      },
    ],
    ctas: [
      {
        number: '1',
        titleKey: 'Install CLI',
        descriptionKey: 'npm, Homebrew, or official installer',
        icon: Download,
      },
      {
        number: '2',
        titleKey: 'Set base URL + key',
        descriptionKey: 'auth.json + config.toml → this gateway /v1',
        icon: Key,
      },
      {
        number: '3',
        titleKey: 'Run codex',
        descriptionKey: 'Start coding with the agent in-terminal',
        icon: Rocket,
      },
    ],
    officialUrl: 'https://developers.openai.com/codex/cli',
  },

  'claude-code': {
    slug: 'claude-code',
    name: 'Claude Code',
    badgeKey: 'Powered by Claude models',
    titleKey: 'Claude Code configuration tutorial',
    subtitleKey:
      'Connect Anthropic Claude Code to this New API gateway via ANTHROPIC_BASE_URL and your console API key.',
    heroGradient: 'from-blue-500 to-violet-600',
    accentClassName: 'text-blue-500',
    terminalLines: [
      { text: '$ npm install -g @anthropic-ai/claude-code', tone: 'cmd' },
      {
        text: '$ export ANTHROPIC_BASE_URL="https://api.wochirou.com"',
        tone: 'cmd',
      },
      {
        text: '$ export ANTHROPIC_AUTH_TOKEN="sk-your-new-api-key"',
        tone: 'cmd',
      },
      { text: '$ claude', tone: 'cmd' },
      {
        text: "Hello! I'm Claude Code. How can I help with your project?",
        tone: 'ok',
      },
    ],
    features: [
      {
        icon: Zap,
        titleKey: 'Pair-programming agent',
        descriptionKey:
          'Beyond autocomplete — Claude Code plans, edits, and runs tasks against your full repo context.',
      },
      {
        icon: Code2,
        titleKey: 'Deep codebase understanding',
        descriptionKey:
          'Refactors, reviews, tests, and docs with awareness of project layout and conventions.',
      },
      {
        icon: Shield,
        titleKey: 'Gateway-friendly auth',
        descriptionKey:
          'Official LLM-gateway mode via ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN / API key.',
      },
      {
        icon: Terminal,
        titleKey: 'Terminal-native',
        descriptionKey:
          'Stay in the shell: inspect files, run builds, and iterate without leaving the CLI.',
      },
    ],
    specs: [
      {
        icon: Terminal,
        titleKey: 'CLI package',
        descriptionKey: '@anthropic-ai/claude-code',
      },
      {
        icon: Zap,
        titleKey: 'Protocol',
        descriptionKey: 'Anthropic Messages API (/v1/messages)',
      },
      {
        icon: Globe,
        titleKey: 'Platforms',
        descriptionKey: 'macOS, Linux, Windows',
      },
    ],
    sections: [
      {
        id: 'install',
        titleKey: 'Install',
        steps: [
          {
            titleKey: 'Install Claude Code',
            codeBlocks: [
              {
                labelKey: 'npm (global)',
                code: 'npm install -g @anthropic-ai/claude-code',
              },
              {
                labelKey: 'Verify',
                code: 'claude --version',
              },
            ],
          },
        ],
      },
      {
        id: 'configure',
        titleKey: 'Configure New API',
        steps: [
          {
            titleKey: 'Create an API key',
            bulletsKeys: [
              'Open Keys / Tokens in this console',
              'Create a key with access to Claude-compatible models',
              'Copy the key for local configuration only',
            ],
          },
          {
            titleKey: 'Environment variables',
            descriptionKey:
              'Claude Code appends /v1/messages itself. Set ANTHROPIC_BASE_URL to the site origin (no trailing /v1). Prefer ANTHROPIC_AUTH_TOKEN for Bearer auth used by most gateways.',
            codeBlocks: [
              {
                labelKey: 'bash / zsh',
                code: `export ANTHROPIC_BASE_URL="{{ANTHROPIC_BASE_URL}}"
export ANTHROPIC_AUTH_TOKEN="sk-your-new-api-key"
# Alternative header style (x-api-key):
# export ANTHROPIC_API_KEY="sk-your-new-api-key"
claude`,
              },
              {
                labelKey: 'PowerShell',
                code: `$env:ANTHROPIC_BASE_URL = "{{ANTHROPIC_BASE_URL}}"
$env:ANTHROPIC_AUTH_TOKEN = "sk-your-new-api-key"
claude`,
              },
            ],
            tipKey:
              'Do not append /v1 to ANTHROPIC_BASE_URL — the client adds the Anthropic path segments.',
          },
          {
            titleKey: 'Persistent settings (~/.claude/settings.json)',
            descriptionKey:
              'User-level env block applies to every Claude Code launch on this machine.',
            codeBlocks: [
              {
                labelKey: '~/.claude/settings.json',
                code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "{{ANTHROPIC_BASE_URL}}",
    "ANTHROPIC_AUTH_TOKEN": "sk-your-new-api-key"
  }
}`,
              },
            ],
          },
          {
            titleKey: 'VS Code extension',
            descriptionKey:
              'If you use the Claude Code VS Code extension, set the same variables in extension settings for reliable gateway routing.',
            codeBlocks: [
              {
                labelKey: 'settings.json',
                code: `{
  "claudeCode.environmentVariables": [
    { "name": "ANTHROPIC_BASE_URL", "value": "{{ANTHROPIC_BASE_URL}}" },
    { "name": "ANTHROPIC_AUTH_TOKEN", "value": "sk-your-new-api-key" }
  ]
}`,
              },
            ],
          },
        ],
      },
      {
        id: 'usage',
        titleKey: 'Usage',
        steps: [
          {
            titleKey: 'Launch and verify routing',
            descriptionKey:
              'Start Claude Code, then run /status and confirm the Anthropic base URL shows this gateway.',
            codeBlocks: [
              {
                code: `cd /path/to/your/project
claude
# inside Claude Code:
/status`,
              },
            ],
          },
          {
            titleKey: 'Example tasks',
            bulletsKeys: [
              'Refactor the authentication module and keep public APIs stable',
              'Generate unit tests for the billing math helpers',
              'Review this PR for race conditions and missing error handling',
            ],
          },
        ],
      },
    ],
    ctas: [
      {
        number: '1',
        titleKey: 'Install CLI',
        descriptionKey: 'npm install -g @anthropic-ai/claude-code',
        icon: Download,
      },
      {
        number: '2',
        titleKey: 'Set gateway env',
        descriptionKey: 'ANTHROPIC_BASE_URL + auth token',
        icon: Key,
      },
      {
        number: '3',
        titleKey: 'Run claude',
        descriptionKey: 'Confirm /status then start coding',
        icon: Rocket,
      },
    ],
    officialUrl: 'https://code.claude.com/docs/en/overview',
  },

  'grok-cli': {
    slug: 'grok-cli',
    name: 'Grok CLI',
    badgeKey: 'Powered by Grok / xAI models',
    titleKey: 'Grok CLI configuration tutorial',
    subtitleKey:
      'Install the Grok coding CLI and route OpenAI-compatible traffic through this New API instance.',
    heroGradient: 'from-zinc-700 to-neutral-900',
    accentClassName: 'text-zinc-700 dark:text-zinc-200',
    terminalLines: [
      { text: '$ curl -fsSL https://x.ai/cli/install.sh | bash', tone: 'cmd' },
      { text: '$ export XAI_API_KEY="sk-your-new-api-key"', tone: 'cmd' },
      { text: '$ grok', tone: 'cmd' },
      {
        text: 'Grok CLI ready — custom base_url via config.toml',
        tone: 'info',
      },
    ],
    features: [
      {
        icon: Bot,
        titleKey: 'Grok coding agent',
        descriptionKey:
          'Interactive TUI and headless modes for repo exploration, edits, and long-running tasks.',
      },
      {
        icon: Sparkles,
        titleKey: 'Strong reasoning models',
        descriptionKey:
          'Use Grok-family models exposed by your New API channels for planning and implementation.',
      },
      {
        icon: Settings,
        titleKey: 'TOML model config',
        descriptionKey:
          'Define custom providers with base_url + env_key in ~/.grok/config.toml.',
      },
      {
        icon: Terminal,
        titleKey: 'Headless automation',
        descriptionKey:
          'Run one-shot prompts with -p for CI scripts and unattended workflows.',
      },
    ],
    specs: [
      {
        icon: Download,
        titleKey: 'CLI install',
        descriptionKey: 'Official xAI installer or community CLIs',
      },
      {
        icon: Globe,
        titleKey: 'API style',
        descriptionKey: 'OpenAI-compatible endpoint via New API /v1',
      },
      {
        icon: Layers,
        titleKey: 'Config',
        descriptionKey: '~/.grok/config.toml',
      },
    ],
    sections: [
      {
        id: 'install',
        titleKey: 'Install',
        steps: [
          {
            titleKey: 'Official Grok Build CLI',
            codeBlocks: [
              {
                labelKey: 'macOS / Linux',
                code: 'curl -fsSL https://x.ai/cli/install.sh | bash',
              },
              {
                labelKey: 'Windows (PowerShell)',
                code: 'irm https://x.ai/cli/install.ps1 | iex',
              },
            ],
            tipKey:
              'If the official binary is unavailable in your region, use any OpenAI-compatible coding CLI against the same /v1 base URL.',
          },
          {
            titleKey: 'Community Grok CLI (optional)',
            descriptionKey:
              'Popular open-source alternative with similar env-based configuration.',
            codeBlocks: [
              {
                code: `# Example community installer — verify the upstream project before use
curl -fsSL https://raw.githubusercontent.com/superagent-ai/grok-cli/main/install.sh | bash`,
              },
            ],
          },
        ],
      },
      {
        id: 'configure',
        titleKey: 'Configure New API',
        steps: [
          {
            titleKey: 'Create an API key',
            bulletsKeys: [
              'Create a token in this console',
              'Enable Grok / xAI (or compatible) models on the key',
              'Store the key in an environment variable',
            ],
          },
          {
            titleKey: 'Environment variables',
            codeBlocks: [
              {
                labelKey: 'bash / zsh',
                code: `export XAI_API_KEY="sk-your-new-api-key"
# Some community CLIs also accept:
# export GROK_API_KEY="sk-your-new-api-key"
# export GROK_BASE_URL="{{OPENAI_BASE_URL}}"`,
              },
            ],
          },
          {
            titleKey: 'Grok home directory layout',
            descriptionKey:
              'Official Grok Build CLI stores state under ~/.grok (Windows: %USERPROFILE%\\.grok). Auth and model routing are separate files.',
            bulletsKeys: [
              '~/.grok/auth.json — OAuth/session tokens and optional cached API keys (sensitive)',
              '~/.grok/config.toml — models, endpoints, UI, permissions, marketplace',
              'Project overrides may appear as ./.grok/config.toml in the working directory',
              'Managed enterprise layers may also load managed_config.toml / requirements.toml',
            ],
            codeBlocks: [
              {
                labelKey: 'Inspect ~/.grok',
                code: `ls -la ~/.grok
# useful files:
#   auth.json   config.toml   sessions/   bin/`,
              },
            ],
          },
        ],
      },
      {
        id: 'auth-json',
        titleKey: 'auth.json',
        steps: [
          {
            titleKey: 'What auth.json is for',
            descriptionKey:
              'Grok Build writes authentication state to ~/.grok/auth.json after browser/device login. The file is intentionally opaque and should be treated as a secret store, not hand-edited for OAuth tokens.',
            bulletsKeys: [
              'Browser OIDC: grok login → tokens cached in auth.json (auto-refresh)',
              'Device code: grok login --device-auth for SSH / headless terminals',
              'API key path for New API / CI: prefer XAI_API_KEY env or model.env_key / model.api_key in config.toml',
              'Never commit auth.json; keep directory permissions tight',
            ],
          },
          {
            titleKey: 'Typical auth.json shape',
            descriptionKey:
              'Exact keys evolve with the CLI. You may see OAuth host entries plus an optional XAI_API_KEY cache. Do not share real tokens — the sample below uses placeholders only.',
            codeBlocks: [
              {
                labelKey: '~/.grok/auth.json (illustrative)',
                code: `{
  "https://auth.x.ai::<client-or-session-id>": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": "..."
  },
  "XAI_API_KEY": "sk-your-new-api-key"
}`,
              },
              {
                labelKey: 'Safe inspection (no secret dump)',
                code: `# List top-level keys only
python3 - <<'PY'
import json, pathlib
p = pathlib.Path.home() / ".grok" / "auth.json"
data = json.loads(p.read_text()) if p.exists() else {}
print(sorted(data.keys()) if isinstance(data, dict) else type(data))
PY`,
              },
            ],
            tipKey:
              'For New API gateways, do not rely on xAI OAuth in auth.json. Use your console API key via env or config.toml model credentials.',
          },
          {
            titleKey: 'Credential resolution order',
            descriptionKey:
              'When a model is selected, Grok resolves credentials roughly in this order (highest first). Knowing the order prevents “wrong account” surprises.',
            bulletsKeys: [
              'model.api_key inside ~/.grok/config.toml (highest, least portable)',
              'model.env_key → value of that environment variable',
              'Active session token from auth.json (official xAI login)',
              'XAI_API_KEY environment variable (good default for New API / CI)',
            ],
            codeBlocks: [
              {
                labelKey: 'Login helpers',
                code: `# Official xAI interactive login (writes auth.json)
grok login
grok login --device-auth

# Prefer API key when using this New API gateway
export XAI_API_KEY="sk-your-new-api-key"
grok`,
              },
            ],
          },
        ],
      },
      {
        id: 'config-toml',
        titleKey: 'config.toml',
        steps: [
          {
            titleKey: 'Minimal New API model config',
            descriptionKey:
              'Define a custom model entry that points base_url at this gateway /v1, then set it as default. Model IDs must match models enabled on your New API channels.',
            codeBlocks: [
              {
                labelKey: '~/.grok/config.toml',
                code: `[models]
default = "newapi"
default_reasoning_effort = "high"

# Optional: also override the global xAI endpoint used by some built-ins
[endpoints]
xai_api_base_url = "{{OPENAI_BASE_URL}}"

[model.newapi]
name = "New API"
description = "Grok models via New API gateway"
model = "grok-4.5"
base_url = "{{OPENAI_BASE_URL}}"
# Prefer env_key over hardcoding secrets:
env_key = "XAI_API_KEY"
# api_key = "sk-your-new-api-key"   # works, but less secure
# responses | chat — pick what your gateway/channel supports
api_backend = "responses"
context_window = 1000000
supports_reasoning_effort = true
reasoning_efforts = ["low", "medium", "high"]`,
              },
            ],
            tipKey:
              'Use the OpenAI-compatible /v1 base URL. After saving, run: export XAI_API_KEY=... && grok inspect',
          },
          {
            titleKey: 'UI, permissions, and CLI behavior',
            descriptionKey:
              'These sections control the TUI experience and automation safety. They are independent from model routing.',
            codeBlocks: [
              {
                labelKey: 'Common companion sections',
                code: `[cli]
auto_update = false

[ui]
# ask | always-approve (names may vary slightly by version)
permission_mode = "ask"
compact_mode = false
# legacy alias seen in some builds:
# yolo = false

# Optional marketplace metadata (usually written by the installer)
# [marketplace]
# official_marketplace_auto_installed = true`,
              },
            ],
          },
          {
            titleKey: 'Full gateway-oriented example',
            descriptionKey:
              'A practical template for routing Grok Build through New API while keeping secrets in the environment.',
            codeBlocks: [
              {
                labelKey: 'Copy-ready template',
                code: `[cli]
auto_update = false

[ui]
permission_mode = "ask"
compact_mode = false

[models]
default = "newapi"
default_reasoning_effort = "high"

[endpoints]
xai_api_base_url = "{{OPENAI_BASE_URL}}"

[model.newapi]
name = "New API"
description = "Routed through this New API deployment"
model = "grok-4.5"
base_url = "{{OPENAI_BASE_URL}}"
env_key = "XAI_API_KEY"
api_backend = "responses"
context_window = 1000000
supports_reasoning_effort = true
reasoning_efforts = ["low", "medium", "high"]

# Optional second model pointing at another channel/model id
# [model.newapi-fast]
# name = "New API Fast"
# model = "grok-3-mini"
# base_url = "{{OPENAI_BASE_URL}}"
# env_key = "XAI_API_KEY"`,
              },
            ],
          },
          {
            titleKey: 'Config load order',
            descriptionKey:
              'Grok merges several layers. Higher-priority managed/requirements files can pin enterprise policy and block overrides.',
            bulletsKeys: [
              'Lowest: /etc/grok/managed_config.toml',
              'Then: ~/.grok/managed_config.toml',
              'Then: ~/.grok/config.toml (your daily settings)',
              'Then: requirements.toml layers that pin non-overridable keys',
              'Project ./.grok/config.toml may add workspace preferences',
            ],
            codeBlocks: [
              {
                labelKey: 'Verify loaded config',
                code: `export XAI_API_KEY="sk-your-new-api-key"
grok inspect
# or list models if available:
grok models`,
              },
            ],
          },
        ],
      },
      {
        id: 'usage',
        titleKey: 'Usage',
        steps: [
          {
            titleKey: 'Interactive and headless modes',
            codeBlocks: [
              {
                labelKey: 'Interactive TUI',
                code: `cd /path/to/your/project
export XAI_API_KEY="sk-your-new-api-key"
grok`,
              },
              {
                labelKey: 'One-shot prompt',
                code: 'grok -p "Explain the request billing flow in this repo"',
              },
            ],
          },
          {
            titleKey: 'Inspect configuration',
            descriptionKey:
              'Use built-in inspect/status commands when available to confirm base_url and selected model.',
            codeBlocks: [
              {
                code: 'grok inspect\n# or: grok models',
              },
            ],
          },
        ],
      },
    ],
    ctas: [
      {
        number: '1',
        titleKey: 'Install Grok CLI',
        descriptionKey: 'Official installer or community CLI',
        icon: Download,
      },
      {
        number: '2',
        titleKey: 'Wire New API',
        descriptionKey: 'auth.json + config.toml → /v1',
        icon: Key,
      },
      {
        number: '3',
        titleKey: 'Start grok',
        descriptionKey: 'Interactive TUI or headless -p mode',
        icon: Rocket,
      },
    ],
    officialUrl: 'https://docs.x.ai/docs',
  },

  'gemini-cli': {
    slug: 'gemini-cli',
    name: 'Gemini CLI',
    badgeKey: 'Powered by Google Gemini',
    titleKey: 'Gemini CLI configuration tutorial',
    subtitleKey:
      'Install Google Gemini CLI and override GOOGLE_GEMINI_BASE_URL so traffic goes through this New API gateway.',
    heroGradient: 'from-purple-500 to-pink-600',
    accentClassName: 'text-purple-500',
    terminalLines: [
      { text: '$ npm install -g @google/gemini-cli', tone: 'cmd' },
      {
        text: '$ export GOOGLE_GEMINI_BASE_URL="https://api.wochirou.com"',
        tone: 'cmd',
      },
      { text: '$ export GEMINI_API_KEY="sk-your-new-api-key"', tone: 'cmd' },
      { text: '$ gemini', tone: 'cmd' },
      {
        text: 'Gemini CLI authenticated via API key — ready.',
        tone: 'ok',
      },
    ],
    features: [
      {
        icon: Layers,
        titleKey: 'Large context window',
        descriptionKey:
          'Gemini models handle large codebases and multi-file reasoning in a single session.',
      },
      {
        icon: Brain,
        titleKey: 'Agent-style workflows',
        descriptionKey:
          'Plan tasks, edit files, and iterate with the official Google Gemini CLI agent loop.',
      },
      {
        icon: Search,
        titleKey: 'Multimodal ready',
        descriptionKey:
          'Work with text and images when your upstream Gemini channel supports it.',
      },
      {
        icon: Globe,
        titleKey: 'Custom base URL',
        descriptionKey:
          'GOOGLE_GEMINI_BASE_URL redirects Gemini API-key traffic to New API /v1beta paths.',
      },
    ],
    specs: [
      {
        icon: Download,
        titleKey: 'CLI package',
        descriptionKey: '@google/gemini-cli',
      },
      {
        icon: Sparkles,
        titleKey: 'Protocol',
        descriptionKey: 'Gemini API (/v1beta/models/...)',
      },
      {
        icon: Globe,
        titleKey: 'Platforms',
        descriptionKey: 'macOS, Linux, Windows',
      },
    ],
    sections: [
      {
        id: 'install',
        titleKey: 'Install',
        steps: [
          {
            titleKey: 'Install Gemini CLI',
            codeBlocks: [
              {
                labelKey: 'npm (global)',
                code: 'npm install -g @google/gemini-cli',
              },
              {
                labelKey: 'npx (no install)',
                code: 'npx @google/gemini-cli',
              },
              {
                labelKey: 'Verify',
                code: 'gemini --version',
              },
            ],
          },
        ],
      },
      {
        id: 'configure',
        titleKey: 'Configure New API',
        steps: [
          {
            titleKey: 'Create an API key',
            bulletsKeys: [
              'Create a token in this console',
              'Ensure Gemini-compatible models are enabled',
              'Use API-key auth in Gemini CLI (not Google account OAuth)',
            ],
          },
          {
            titleKey: 'Environment variables',
            descriptionKey:
              'Set the host root as GOOGLE_GEMINI_BASE_URL. Gemini CLI will call /v1beta/... on that host. New API exposes Gemini-compatible routes under /v1beta.',
            codeBlocks: [
              {
                labelKey: 'bash / zsh',
                code: `export GOOGLE_GEMINI_BASE_URL="{{GEMINI_BASE_URL}}"
export GEMINI_API_KEY="sk-your-new-api-key"
gemini`,
              },
              {
                labelKey: 'PowerShell',
                code: `$env:GOOGLE_GEMINI_BASE_URL = "{{GEMINI_BASE_URL}}"
$env:GEMINI_API_KEY = "sk-your-new-api-key"
gemini`,
              },
            ],
            tipKey:
              'Choose “Use Gemini API Key” auth. Google login may ignore custom base URLs.',
          },
          {
            titleKey: 'Optional .env file',
            descriptionKey:
              'Gemini CLI loads dotenv from the project directory or home directory.',
            codeBlocks: [
              {
                labelKey: '.env',
                code: `GOOGLE_GEMINI_BASE_URL={{GEMINI_BASE_URL}}
GEMINI_API_KEY=sk-your-new-api-key`,
              },
            ],
          },
        ],
      },
      {
        id: 'usage',
        titleKey: 'Usage',
        steps: [
          {
            titleKey: 'Start Gemini CLI',
            codeBlocks: [
              {
                code: `cd /path/to/your/project
gemini
# If prompted for auth, select Gemini API Key`,
              },
            ],
          },
          {
            titleKey: 'Example prompts',
            bulletsKeys: [
              'Map the frontend routing structure and list public pages',
              'Propose a safer quota conversion helper with tests',
              'Generate a migration checklist for this feature module',
            ],
          },
        ],
      },
    ],
    ctas: [
      {
        number: '1',
        titleKey: 'Install CLI',
        descriptionKey: 'npm install -g @google/gemini-cli',
        icon: Download,
      },
      {
        number: '2',
        titleKey: 'Set base URL + key',
        descriptionKey: 'GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY',
        icon: Key,
      },
      {
        number: '3',
        titleKey: 'Run gemini',
        descriptionKey: 'API key auth against this gateway',
        icon: Rocket,
      },
    ],
    officialUrl: 'https://geminicli.com/docs/',
  },
}
