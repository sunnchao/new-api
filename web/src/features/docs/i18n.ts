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

const en = {
  'Configuration tutorials': 'Configuration tutorials',
  'OpenAI Codex CLI setup with this gateway':
    'OpenAI Codex CLI setup with this gateway',
  'Anthropic Claude Code + New API endpoint':
    'Anthropic Claude Code + New API endpoint',
  'Grok / xAI CLI configuration tutorial':
    'Grok / xAI CLI configuration tutorial',
  'Google Gemini CLI configuration tutorial':
    'Google Gemini CLI configuration tutorial',
  'New API project documentation': 'New API project documentation',
  'Vibe coding tool tutorials': 'Vibe coding tool tutorials',
  'Configure popular terminal coding agents to use this New API deployment as their upstream. Each guide includes install steps, env vars, and copy-ready endpoints.':
    'Configure popular terminal coding agents to use this New API deployment as their upstream. Each guide includes install steps, env vars, and copy-ready endpoints.',
  'Open guide': 'Open guide',
  'All tutorials': 'All tutorials',
  'Get API key': 'Get API key',
  'Tool official docs': 'Tool official docs',
  'Terminal preview': 'Terminal preview',
  Terminal: 'Terminal',
  'Your gateway endpoints': 'Your gateway endpoints',
  'Values below are generated from the current site origin so you can copy them directly.':
    'Use these fixed gateway endpoints (https://api.wochirou.com) — copy them into your CLI config.',
  'Anthropic base URL': 'Anthropic base URL',
  'Claude Code appends /v1/messages automatically':
    'Claude Code appends /v1/messages automatically',
  'Gemini base URL': 'Gemini base URL',
  'Gemini CLI calls /v1beta routes on this host':
    'Gemini CLI calls /v1beta routes on this host',
  'OpenAI-compatible base URL': 'OpenAI-compatible base URL',
  'Include /v1 for OpenAI-compatible clients':
    'Include /v1 for OpenAI-compatible clients',
  'Base URL': 'Base URL',
  'API key': 'API key',
  'Create a token in the console Keys page, then paste it into the environment variables shown in the steps below.':
    'Create a token in the console Keys page, then paste it into the environment variables shown in the steps below.',
  'Open Keys': 'Open Keys',
  'Feature overview': 'Feature overview',
  'Setup guide': 'Setup guide',
  'Ready to start?': 'Ready to start?',
  'Three short steps are enough to route this vibe-coding tool through your New API deployment.':
    'Three short steps are enough to route this vibe-coding tool through your New API deployment.',

  'Powered by OpenAI Codex models': 'Powered by OpenAI Codex models',
  'Codex CLI configuration tutorial': 'Codex CLI configuration tutorial',
  'Install OpenAI Codex CLI and point it at this New API gateway for agentic coding in your terminal.':
    'Install OpenAI Codex CLI and point it at this New API gateway for agentic coding in your terminal.',
  'Agentic code edits': 'Agentic code edits',
  'Explore the repo, apply multi-file changes, and run commands with an OpenAI coding agent.':
    'Explore the repo, apply multi-file changes, and run commands with an OpenAI coding agent.',
  'Git-aware workflow': 'Git-aware workflow',
  'Review diffs, craft commits, and keep local changes under control while the agent works.':
    'Review diffs, craft commits, and keep local changes under control while the agent works.',
  'Custom providers': 'Custom providers',
  'Route traffic through New API with OPENAI_BASE_URL or ~/.codex/config.toml providers.':
    'Route traffic through New API with OPENAI_BASE_URL or ~/.codex/config.toml providers.',
  'OpenAI-compatible API': 'OpenAI-compatible API',
  'Use the same keys you create in the console — no separate OpenAI account required on the client.':
    'Use the same keys you create in the console — no separate OpenAI account required on the client.',
  'CLI package': 'CLI package',
  'npm / Homebrew / official installers':
    'npm / Homebrew / official installers',
  Protocol: 'Protocol',
  'OpenAI Chat Completions compatible (/v1)':
    'OpenAI Chat Completions compatible (/v1)',
  Platforms: 'Platforms',
  'macOS, Linux, Windows': 'macOS, Linux, Windows',
  Install: 'Install',
  'Install Codex CLI': 'Install Codex CLI',
  'Pick one installer. Node.js 18+ is required for the npm path.':
    'Pick one installer. Node.js 18+ is required for the npm path.',
  'npm (global)': 'npm (global)',
  'Homebrew (macOS)': 'Homebrew (macOS)',
  'Official installer (macOS / Linux)': 'Official installer (macOS / Linux)',
  'Verify the binary': 'Verify the binary',
  'Configure New API': 'Configure New API',
  'Create an API key': 'Create an API key',
  'Sign in to this console, open Keys / Tokens, create a key, and copy it once.':
    'Sign in to this console, open Keys / Tokens, create a key, and copy it once.',
  'Prefer a dedicated key for CLI usage':
    'Prefer a dedicated key for CLI usage',
  'Enable the models you plan to use with Codex':
    'Enable the models you plan to use with Codex',
  'Keep the key out of git and shared screenshots':
    'Keep the key out of git and shared screenshots',
  'Environment variables (quick start)': 'Environment variables (quick start)',
  'Point Codex at this gateway with OpenAI-compatible env vars. Replace the key with yours.':
    'Point Codex at this gateway with OpenAI-compatible env vars. Replace the key with yours.',
  'bash / zsh': 'bash / zsh',
  PowerShell: 'PowerShell',
  'OPENAI_BASE_URL must include the /v1 suffix for OpenAI-compatible gateways.':
    'OPENAI_BASE_URL must include the /v1 suffix for OpenAI-compatible gateways.',
  'Persistent config (~/.codex/config.toml)':
    'Persistent config (~/.codex/config.toml)',
  'Recommended for daily use. Provider settings belong in the user config, not project config.':
    'Recommended for daily use. Provider settings belong in the user config, not project config.',
  '~/.codex/config.toml': '~/.codex/config.toml',
  Usage: 'Usage',
  'Start in a project directory': 'Start in a project directory',
  'Useful first prompts': 'Useful first prompts',
  'Summarize this repository structure': 'Summarize this repository structure',
  'Find the auth middleware and explain the flow':
    'Find the auth middleware and explain the flow',
  'Add unit tests for the quota helper without changing public APIs':
    'Add unit tests for the quota helper without changing public APIs',
  'Install CLI': 'Install CLI',
  'npm, Homebrew, or official installer':
    'npm, Homebrew, or official installer',
  'Set base URL + key': 'Set base URL + key',
  'OPENAI_BASE_URL → this gateway /v1': 'OPENAI_BASE_URL → this gateway /v1',
  'auth.json + config.toml → this gateway /v1':
    'auth.json + config.toml → this gateway /v1',
  'Run codex': 'Run codex',
  'Start coding with the agent in-terminal':
    'Start coding with the agent in-terminal',

  'Codex home directory layout': 'Codex home directory layout',
  'Codex stores user state under CODEX_HOME (default ~/.codex on macOS/Linux, %USERPROFILE%\\.codex on Windows). Credentials and provider routing are split into separate files.':
    'Codex stores user state under CODEX_HOME (default ~/.codex on macOS/Linux, %USERPROFILE%\\.codex on Windows). Credentials and provider routing are split into separate files.',
  '~/.codex/auth.json — cached login / API-key credentials (sensitive)':
    '~/.codex/auth.json — cached login / API-key credentials (sensitive)',
  '~/.codex/config.toml — models, providers, sandbox, MCP, and preferences':
    '~/.codex/config.toml — models, providers, sandbox, MCP, and preferences',
  'Project overrides may live in <repo>/.codex/config.toml (trusted projects only)':
    'Project overrides may live in <repo>/.codex/config.toml (trusted projects only)',
  'Do not put secrets in project config or commit them to git':
    'Do not put secrets in project config or commit them to git',
  'Inspect CODEX_HOME': 'Inspect CODEX_HOME',
  'auth.json': 'auth.json',
  'What auth.json is for': 'What auth.json is for',
  'Codex never stores API keys inside config.toml. After login or API-key setup, credentials are cached in the OS keyring (preferred) or in ~/.codex/auth.json when file storage is used.':
    'Codex never stores API keys inside config.toml. After login or API-key setup, credentials are cached in the OS keyring (preferred) or in ~/.codex/auth.json when file storage is used.',
  'auth_mode = "apiKey" — recommended when routing through New API':
    'auth_mode = "apiKey" — recommended when routing through New API',
  'auth_mode = "chatgpt" — official ChatGPT OAuth tokens (not for custom gateways)':
    'auth_mode = "chatgpt" — official ChatGPT OAuth tokens (not for custom gateways)',
  'Treat auth.json like a password: mode 600, never commit, never paste into tickets':
    'Treat auth.json like a password: mode 600, never commit, never paste into tickets',
  'If you switch from ChatGPT login to a New API key, rewrite auth.json or re-login':
    'If you switch from ChatGPT login to a New API key, rewrite auth.json or re-login',
  'API-key mode for New API (recommended)':
    'API-key mode for New API (recommended)',
  'Use the key from this console. File-based storage is useful for headless machines and for inspecting what Codex will send.':
    'Use the key from this console. File-based storage is useful for headless machines and for inspecting what Codex will send.',
  '~/.codex/auth.json': '~/.codex/auth.json',
  'Create safely (bash)': 'Create safely (bash)',
  'Prefer env OPENAI_API_KEY + config.toml provider env_key when possible. auth.json is mainly for cached credentials and CI seeding.':
    'Prefer env OPENAI_API_KEY + config.toml provider env_key when possible. auth.json is mainly for cached credentials and CI seeding.',
  'ChatGPT OAuth mode (official only)': 'ChatGPT OAuth mode (official only)',
  'If you previously ran codex login against ChatGPT, auth.json may look like the example below. This mode talks to OpenAI, not your New API gateway — switch to apiKey mode for gateway routing.':
    'If you previously ran codex login against ChatGPT, auth.json may look like the example below. This mode talks to OpenAI, not your New API gateway — switch to apiKey mode for gateway routing.',
  'ChatGPT-style auth.json (do not use with New API)':
    'ChatGPT-style auth.json (do not use with New API)',
  'Choose credential store in config.toml':
    'Choose credential store in config.toml',
  'Control where credentials are written. file forces auth.json; keyring uses the OS secret store; auto prefers keyring when available.':
    'Control where credentials are written. file forces auth.json; keyring uses the OS secret store; auto prefers keyring when available.',
  'Snippet for ~/.codex/config.toml': 'Snippet for ~/.codex/config.toml',
  'Login / logout helpers': 'Login / logout helpers',
  'config.toml': 'config.toml',
  'Minimal New API provider config': 'Minimal New API provider config',
  'Recommended daily setup: define a custom model provider that points at this gateway /v1, then select it with model_provider. Keep this in the user config (~/.codex/config.toml), not project config — project files cannot override provider/auth keys.':
    'Recommended daily setup: define a custom model provider that points at this gateway /v1, then select it with model_provider. Keep this in the user config (~/.codex/config.toml), not project config — project files cannot override provider/auth keys.',
  'After editing, open a new shell so OPENAI_API_KEY is present, then run: codex':
    'After editing, open a new shell so OPENAI_API_KEY is present, then run: codex',
  'Built-in openai provider override': 'Built-in openai provider override',
  'If you prefer not to define a custom provider id, you can override the built-in openai base URL. Custom [model_providers.*] is still clearer for multi-provider setups.':
    'If you prefer not to define a custom provider id, you can override the built-in openai base URL. Custom [model_providers.*] is still clearer for multi-provider setups.',
  'Alternative: openai_base_url': 'Alternative: openai_base_url',
  'Useful optional keys': 'Useful optional keys',
  'These keys are commonly adjusted for gateway and local workflows. Exact defaults depend on your Codex version — check the official config reference if a key is rejected.':
    'These keys are commonly adjusted for gateway and local workflows. Exact defaults depend on your Codex version — check the official config reference if a key is rejected.',
  'approval_policy — untrusted | on-request | never':
    'approval_policy — untrusted | on-request | never',
  'sandbox_mode — read-only | workspace-write | danger-full-access':
    'sandbox_mode — read-only | workspace-write | danger-full-access',
  'model_reasoning_effort — minimal | low | medium | high | xhigh':
    'model_reasoning_effort — minimal | low | medium | high | xhigh',
  'disable_response_storage — avoid uploading conversation storage when unsupported':
    'disable_response_storage — avoid uploading conversation storage when unsupported',
  '[features] — experimental feature flags':
    '[features] — experimental feature flags',
  '[mcp_servers.*] — local MCP tool servers':
    '[mcp_servers.*] — local MCP tool servers',
  'Expanded example': 'Expanded example',
  'Config precedence and profiles': 'Config precedence and profiles',
  'Closest trusted config wins, but provider/auth keys are restricted to user/system configs for safety.':
    'Closest trusted config wins, but provider/auth keys are restricted to user/system configs for safety.',
  'CLI flags / -c overrides win over files':
    'CLI flags / -c overrides win over files',
  'Trusted project .codex/config.toml can set local preferences only':
    'Trusted project .codex/config.toml can set local preferences only',
  'Named profiles: ~/.codex/<name>.config.toml then codex --profile <name>':
    'Named profiles: ~/.codex/<name>.config.toml then codex --profile <name>',
  'User ~/.codex/config.toml is the right place for New API base_url + model_provider':
    'User ~/.codex/config.toml is the right place for New API base_url + model_provider',
  'System /etc/codex/config.toml and requirements.toml may lock enterprise settings':
    'System /etc/codex/config.toml and requirements.toml may lock enterprise settings',
  'Validate / edit helpers': 'Validate / edit helpers',

  'Powered by Claude models': 'Powered by Claude models',
  'Claude Code configuration tutorial': 'Claude Code configuration tutorial',
  'Connect Anthropic Claude Code to this New API gateway via ANTHROPIC_BASE_URL and your console API key.':
    'Connect Anthropic Claude Code to this New API gateway via ANTHROPIC_BASE_URL and your console API key.',
  'Pair-programming agent': 'Pair-programming agent',
  'Beyond autocomplete — Claude Code plans, edits, and runs tasks against your full repo context.':
    'Beyond autocomplete — Claude Code plans, edits, and runs tasks against your full repo context.',
  'Deep codebase understanding': 'Deep codebase understanding',
  'Refactors, reviews, tests, and docs with awareness of project layout and conventions.':
    'Refactors, reviews, tests, and docs with awareness of project layout and conventions.',
  'Gateway-friendly auth': 'Gateway-friendly auth',
  'Official LLM-gateway mode via ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN / API key.':
    'Official LLM-gateway mode via ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN / API key.',
  'Terminal-native': 'Terminal-native',
  'Stay in the shell: inspect files, run builds, and iterate without leaving the CLI.':
    'Stay in the shell: inspect files, run builds, and iterate without leaving the CLI.',
  '@anthropic-ai/claude-code': '@anthropic-ai/claude-code',
  'Anthropic Messages API (/v1/messages)':
    'Anthropic Messages API (/v1/messages)',
  'Install Claude Code': 'Install Claude Code',
  Verify: 'Verify',
  'Open Keys / Tokens in this console': 'Open Keys / Tokens in this console',
  'Create a key with access to Claude-compatible models':
    'Create a key with access to Claude-compatible models',
  'Copy the key for local configuration only':
    'Copy the key for local configuration only',
  'Environment variables': 'Environment variables',
  'Claude Code appends /v1/messages itself. Set ANTHROPIC_BASE_URL to the site origin (no trailing /v1). Prefer ANTHROPIC_AUTH_TOKEN for Bearer auth used by most gateways.':
    'Claude Code appends /v1/messages itself. Set ANTHROPIC_BASE_URL to the site origin (no trailing /v1). Prefer ANTHROPIC_AUTH_TOKEN for Bearer auth used by most gateways.',
  'Do not append /v1 to ANTHROPIC_BASE_URL — the client adds the Anthropic path segments.':
    'Do not append /v1 to ANTHROPIC_BASE_URL — the client adds the Anthropic path segments.',
  'Persistent settings (~/.claude/settings.json)':
    'Persistent settings (~/.claude/settings.json)',
  'User-level env block applies to every Claude Code launch on this machine.':
    'User-level env block applies to every Claude Code launch on this machine.',
  '~/.claude/settings.json': '~/.claude/settings.json',
  'VS Code extension': 'VS Code extension',
  'If you use the Claude Code VS Code extension, set the same variables in extension settings for reliable gateway routing.':
    'If you use the Claude Code VS Code extension, set the same variables in extension settings for reliable gateway routing.',
  'settings.json': 'settings.json',
  'Launch and verify routing': 'Launch and verify routing',
  'Start Claude Code, then run /status and confirm the Anthropic base URL shows this gateway.':
    'Start Claude Code, then run /status and confirm the Anthropic base URL shows this gateway.',
  'Example tasks': 'Example tasks',
  'Refactor the authentication module and keep public APIs stable':
    'Refactor the authentication module and keep public APIs stable',
  'Generate unit tests for the billing math helpers':
    'Generate unit tests for the billing math helpers',
  'Review this PR for race conditions and missing error handling':
    'Review this PR for race conditions and missing error handling',
  'npm install -g @anthropic-ai/claude-code':
    'npm install -g @anthropic-ai/claude-code',
  'Set gateway env': 'Set gateway env',
  'ANTHROPIC_BASE_URL + auth token': 'ANTHROPIC_BASE_URL + auth token',
  'Run claude': 'Run claude',
  'Confirm /status then start coding': 'Confirm /status then start coding',

  'Powered by Grok / xAI models': 'Powered by Grok / xAI models',
  'Grok CLI configuration tutorial': 'Grok CLI configuration tutorial',
  'Install the Grok coding CLI and route OpenAI-compatible traffic through this New API instance.':
    'Install the Grok coding CLI and route OpenAI-compatible traffic through this New API instance.',
  'Grok coding agent': 'Grok coding agent',
  'Interactive TUI and headless modes for repo exploration, edits, and long-running tasks.':
    'Interactive TUI and headless modes for repo exploration, edits, and long-running tasks.',
  'Strong reasoning models': 'Strong reasoning models',
  'Use Grok-family models exposed by your New API channels for planning and implementation.':
    'Use Grok-family models exposed by your New API channels for planning and implementation.',
  'TOML model config': 'TOML model config',
  'Define custom providers with base_url + env_key in ~/.grok/config.toml.':
    'Define custom providers with base_url + env_key in ~/.grok/config.toml.',
  'Headless automation': 'Headless automation',
  'Run one-shot prompts with -p for CI scripts and unattended workflows.':
    'Run one-shot prompts with -p for CI scripts and unattended workflows.',
  'CLI install': 'CLI install',
  'Official xAI installer or community CLIs':
    'Official xAI installer or community CLIs',
  'API style': 'API style',
  'OpenAI-compatible endpoint via New API /v1':
    'OpenAI-compatible endpoint via New API /v1',
  Config: 'Config',
  '~/.grok/config.toml': '~/.grok/config.toml',
  'Official Grok Build CLI': 'Official Grok Build CLI',
  'macOS / Linux': 'macOS / Linux',
  'Windows (PowerShell)': 'Windows (PowerShell)',
  'If the official binary is unavailable in your region, use any OpenAI-compatible coding CLI against the same /v1 base URL.':
    'If the official binary is unavailable in your region, use any OpenAI-compatible coding CLI against the same /v1 base URL.',
  'Community Grok CLI (optional)': 'Community Grok CLI (optional)',
  'Popular open-source alternative with similar env-based configuration.':
    'Popular open-source alternative with similar env-based configuration.',
  'Create a token in this console': 'Create a token in this console',
  'Enable Grok / xAI (or compatible) models on the key':
    'Enable Grok / xAI (or compatible) models on the key',
  'Store the key in an environment variable':
    'Store the key in an environment variable',
  'Custom provider in ~/.grok/config.toml':
    'Custom provider in ~/.grok/config.toml',
  'Point the CLI at this OpenAI-compatible gateway. Adjust model IDs to match models available on your New API instance.':
    'Point the CLI at this OpenAI-compatible gateway. Adjust model IDs to match models available on your New API instance.',
  'Use the OpenAI-compatible /v1 base URL. Model IDs must match what your channels expose.':
    'Use the OpenAI-compatible /v1 base URL. Model IDs must match what your channels expose.',
  'Interactive and headless modes': 'Interactive and headless modes',
  'Interactive TUI': 'Interactive TUI',
  'One-shot prompt': 'One-shot prompt',
  'Inspect configuration': 'Inspect configuration',
  'Use built-in inspect/status commands when available to confirm base_url and selected model.':
    'Use built-in inspect/status commands when available to confirm base_url and selected model.',
  'Install Grok CLI': 'Install Grok CLI',
  'Official installer or community CLI': 'Official installer or community CLI',
  'Wire New API': 'Wire New API',
  'XAI_API_KEY + base_url=/v1': 'XAI_API_KEY + base_url=/v1',
  'auth.json + config.toml → /v1': 'auth.json + config.toml → /v1',
  'Start grok': 'Start grok',
  'Interactive TUI or headless -p mode': 'Interactive TUI or headless -p mode',

  'Grok home directory layout': 'Grok home directory layout',
  'Official Grok Build CLI stores state under ~/.grok (Windows: %USERPROFILE%\\.grok). Auth and model routing are separate files.':
    'Official Grok Build CLI stores state under ~/.grok (Windows: %USERPROFILE%\\.grok). Auth and model routing are separate files.',
  '~/.grok/auth.json — OAuth/session tokens and optional cached API keys (sensitive)':
    '~/.grok/auth.json — OAuth/session tokens and optional cached API keys (sensitive)',
  '~/.grok/config.toml — models, endpoints, UI, permissions, marketplace':
    '~/.grok/config.toml — models, endpoints, UI, permissions, marketplace',
  'Project overrides may appear as ./.grok/config.toml in the working directory':
    'Project overrides may appear as ./.grok/config.toml in the working directory',
  'Managed enterprise layers may also load managed_config.toml / requirements.toml':
    'Managed enterprise layers may also load managed_config.toml / requirements.toml',
  'Inspect ~/.grok': 'Inspect ~/.grok',
  'Grok Build writes authentication state to ~/.grok/auth.json after browser/device login. The file is intentionally opaque and should be treated as a secret store, not hand-edited for OAuth tokens.':
    'Grok Build writes authentication state to ~/.grok/auth.json after browser/device login. The file is intentionally opaque and should be treated as a secret store, not hand-edited for OAuth tokens.',
  'Browser OIDC: grok login → tokens cached in auth.json (auto-refresh)':
    'Browser OIDC: grok login → tokens cached in auth.json (auto-refresh)',
  'Device code: grok login --device-auth for SSH / headless terminals':
    'Device code: grok login --device-auth for SSH / headless terminals',
  'API key path for New API / CI: prefer XAI_API_KEY env or model.env_key / model.api_key in config.toml':
    'API key path for New API / CI: prefer XAI_API_KEY env or model.env_key / model.api_key in config.toml',
  'Never commit auth.json; keep directory permissions tight':
    'Never commit auth.json; keep directory permissions tight',
  'Typical auth.json shape': 'Typical auth.json shape',
  'Exact keys evolve with the CLI. You may see OAuth host entries plus an optional XAI_API_KEY cache. Do not share real tokens — the sample below uses placeholders only.':
    'Exact keys evolve with the CLI. You may see OAuth host entries plus an optional XAI_API_KEY cache. Do not share real tokens — the sample below uses placeholders only.',
  '~/.grok/auth.json (illustrative)': '~/.grok/auth.json (illustrative)',
  'Safe inspection (no secret dump)': 'Safe inspection (no secret dump)',
  'For New API gateways, do not rely on xAI OAuth in auth.json. Use your console API key via env or config.toml model credentials.':
    'For New API gateways, do not rely on xAI OAuth in auth.json. Use your console API key via env or config.toml model credentials.',
  'Credential resolution order': 'Credential resolution order',
  'When a model is selected, Grok resolves credentials roughly in this order (highest first). Knowing the order prevents “wrong account” surprises.':
    'When a model is selected, Grok resolves credentials roughly in this order (highest first). Knowing the order prevents “wrong account” surprises.',
  'model.api_key inside ~/.grok/config.toml (highest, least portable)':
    'model.api_key inside ~/.grok/config.toml (highest, least portable)',
  'model.env_key → value of that environment variable':
    'model.env_key → value of that environment variable',
  'Active session token from auth.json (official xAI login)':
    'Active session token from auth.json (official xAI login)',
  'XAI_API_KEY environment variable (good default for New API / CI)':
    'XAI_API_KEY environment variable (good default for New API / CI)',
  'Login helpers': 'Login helpers',
  'Minimal New API model config': 'Minimal New API model config',
  'Define a custom model entry that points base_url at this gateway /v1, then set it as default. Model IDs must match models enabled on your New API channels.':
    'Define a custom model entry that points base_url at this gateway /v1, then set it as default. Model IDs must match models enabled on your New API channels.',
  'Use the OpenAI-compatible /v1 base URL. After saving, run: export XAI_API_KEY=... && grok inspect':
    'Use the OpenAI-compatible /v1 base URL. After saving, run: export XAI_API_KEY=... && grok inspect',
  'UI, permissions, and CLI behavior': 'UI, permissions, and CLI behavior',
  'These sections control the TUI experience and automation safety. They are independent from model routing.':
    'These sections control the TUI experience and automation safety. They are independent from model routing.',
  'Common companion sections': 'Common companion sections',
  'Full gateway-oriented example': 'Full gateway-oriented example',
  'A practical template for routing Grok Build through New API while keeping secrets in the environment.':
    'A practical template for routing Grok Build through New API while keeping secrets in the environment.',
  'Copy-ready template': 'Copy-ready template',
  'Config load order': 'Config load order',
  'Grok merges several layers. Higher-priority managed/requirements files can pin enterprise policy and block overrides.':
    'Grok merges several layers. Higher-priority managed/requirements files can pin enterprise policy and block overrides.',
  'Lowest: /etc/grok/managed_config.toml':
    'Lowest: /etc/grok/managed_config.toml',
  'Then: ~/.grok/managed_config.toml': 'Then: ~/.grok/managed_config.toml',
  'Then: ~/.grok/config.toml (your daily settings)':
    'Then: ~/.grok/config.toml (your daily settings)',
  'Then: requirements.toml layers that pin non-overridable keys':
    'Then: requirements.toml layers that pin non-overridable keys',
  'Project ./.grok/config.toml may add workspace preferences':
    'Project ./.grok/config.toml may add workspace preferences',
  'Verify loaded config': 'Verify loaded config',

  'Powered by Google Gemini': 'Powered by Google Gemini',
  'Gemini CLI configuration tutorial': 'Gemini CLI configuration tutorial',
  'Install Google Gemini CLI and override GOOGLE_GEMINI_BASE_URL so traffic goes through this New API gateway.':
    'Install Google Gemini CLI and override GOOGLE_GEMINI_BASE_URL so traffic goes through this New API gateway.',
  'Large context window': 'Large context window',
  'Gemini models handle large codebases and multi-file reasoning in a single session.':
    'Gemini models handle large codebases and multi-file reasoning in a single session.',
  'Agent-style workflows': 'Agent-style workflows',
  'Plan tasks, edit files, and iterate with the official Google Gemini CLI agent loop.':
    'Plan tasks, edit files, and iterate with the official Google Gemini CLI agent loop.',
  'Multimodal ready': 'Multimodal ready',
  'Work with text and images when your upstream Gemini channel supports it.':
    'Work with text and images when your upstream Gemini channel supports it.',
  'Custom base URL': 'Custom base URL',
  'GOOGLE_GEMINI_BASE_URL redirects Gemini API-key traffic to New API /v1beta paths.':
    'GOOGLE_GEMINI_BASE_URL redirects Gemini API-key traffic to New API /v1beta paths.',
  '@google/gemini-cli': '@google/gemini-cli',
  'Gemini API (/v1beta/models/...)': 'Gemini API (/v1beta/models/...)',
  'Install Gemini CLI': 'Install Gemini CLI',
  'npx (no install)': 'npx (no install)',
  'Ensure Gemini-compatible models are enabled':
    'Ensure Gemini-compatible models are enabled',
  'Use API-key auth in Gemini CLI (not Google account OAuth)':
    'Use API-key auth in Gemini CLI (not Google account OAuth)',
  'Set the host root as GOOGLE_GEMINI_BASE_URL. Gemini CLI will call /v1beta/... on that host. New API exposes Gemini-compatible routes under /v1beta.':
    'Set the host root as GOOGLE_GEMINI_BASE_URL. Gemini CLI will call /v1beta/... on that host. New API exposes Gemini-compatible routes under /v1beta.',
  'Choose “Use Gemini API Key” auth. Google login may ignore custom base URLs.':
    'Choose “Use Gemini API Key” auth. Google login may ignore custom base URLs.',
  'Optional .env file': 'Optional .env file',
  'Gemini CLI loads dotenv from the project directory or home directory.':
    'Gemini CLI loads dotenv from the project directory or home directory.',
  '.env': '.env',
  'Start Gemini CLI': 'Start Gemini CLI',
  'Example prompts': 'Example prompts',
  'Map the frontend routing structure and list public pages':
    'Map the frontend routing structure and list public pages',
  'Propose a safer quota conversion helper with tests':
    'Propose a safer quota conversion helper with tests',
  'Generate a migration checklist for this feature module':
    'Generate a migration checklist for this feature module',
  'npm install -g @google/gemini-cli': 'npm install -g @google/gemini-cli',
  'GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY':
    'GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY',
  'Run gemini': 'Run gemini',
  'API key auth against this gateway': 'API key auth against this gateway',
} as const

const zhCN: Record<keyof typeof en, string> = {
  'Configuration tutorials': '配置教程',
  'OpenAI Codex CLI setup with this gateway':
    'OpenAI Codex CLI 对接本网关配置',
  'Anthropic Claude Code + New API endpoint':
    'Anthropic Claude Code 对接 New API',
  'Grok / xAI CLI configuration tutorial': 'Grok / xAI CLI 配置教程',
  'Google Gemini CLI configuration tutorial': 'Google Gemini CLI 配置教程',
  'New API project documentation': 'New API 官方文档',
  'Vibe coding tool tutorials': 'Vibe Coding 工具教程',
  'Configure popular terminal coding agents to use this New API deployment as their upstream. Each guide includes install steps, env vars, and copy-ready endpoints.':
    '将主流终端编程 Agent 配置为使用本 New API 实例作为上游。每篇教程包含安装步骤、环境变量与可复制的端点地址。',
  'Open guide': '打开教程',
  'All tutorials': '全部教程',
  'Get API key': '获取 API Key',
  'Tool official docs': '工具官方文档',
  'Terminal preview': '终端预览',
  Terminal: '终端',
  'Your gateway endpoints': '当前网关端点',
  'Values below are generated from the current site origin so you can copy them directly.':
    '以下为固定网关地址（https://api.wochirou.com），可直接复制到 CLI 配置中使用。',
  'Anthropic base URL': 'Anthropic Base URL',
  'Claude Code appends /v1/messages automatically':
    'Claude Code 会自动拼接 /v1/messages',
  'Gemini base URL': 'Gemini Base URL',
  'Gemini CLI calls /v1beta routes on this host':
    'Gemini CLI 会在此主机上请求 /v1beta 路径',
  'OpenAI-compatible base URL': 'OpenAI 兼容 Base URL',
  'Include /v1 for OpenAI-compatible clients':
    'OpenAI 兼容客户端需包含 /v1 后缀',
  'Base URL': 'Base URL',
  'API key': 'API 密钥',
  'Create a token in the console Keys page, then paste it into the environment variables shown in the steps below.':
    '在控制台「密钥」页面创建令牌，然后粘贴到下方步骤中的环境变量。',
  'Open Keys': '打开密钥页',
  'Feature overview': '功能概览',
  'Setup guide': '配置指南',
  'Ready to start?': '准备好开始了吗？',
  'Three short steps are enough to route this vibe-coding tool through your New API deployment.':
    '只需三步，即可让该 Vibe Coding 工具通过你的 New API 实例进行请求。',

  'Powered by OpenAI Codex models': '由 OpenAI Codex 模型驱动',
  'Codex CLI configuration tutorial': 'Codex CLI 配置教程',
  'Install OpenAI Codex CLI and point it at this New API gateway for agentic coding in your terminal.':
    '安装 OpenAI Codex CLI，并将其指向本 New API 网关，在终端中进行智能编程。',
  'Agentic code edits': '智能代码编辑',
  'Explore the repo, apply multi-file changes, and run commands with an OpenAI coding agent.':
    '探索仓库、进行多文件修改，并由 OpenAI 编程 Agent 执行命令。',
  'Git-aware workflow': 'Git 感知工作流',
  'Review diffs, craft commits, and keep local changes under control while the agent works.':
    '在 Agent 工作时审查 diff、撰写提交信息并掌控本地变更。',
  'Custom providers': '自定义供应商',
  'Route traffic through New API with OPENAI_BASE_URL or ~/.codex/config.toml providers.':
    '通过 OPENAI_BASE_URL 或 ~/.codex/config.toml 将流量路由到 New API。',
  'OpenAI-compatible API': 'OpenAI 兼容 API',
  'Use the same keys you create in the console — no separate OpenAI account required on the client.':
    '直接使用控制台创建的密钥，客户端无需单独 OpenAI 账号。',
  'CLI package': 'CLI 安装包',
  'npm / Homebrew / official installers': 'npm / Homebrew / 官方安装脚本',
  Protocol: '协议',
  'OpenAI Chat Completions compatible (/v1)':
    'OpenAI Chat Completions 兼容（/v1）',
  Platforms: '平台',
  'macOS, Linux, Windows': 'macOS、Linux、Windows',
  Install: '安装',
  'Install Codex CLI': '安装 Codex CLI',
  'Pick one installer. Node.js 18+ is required for the npm path.':
    '任选一种安装方式。npm 方式需要 Node.js 18+。',
  'npm (global)': 'npm（全局）',
  'Homebrew (macOS)': 'Homebrew（macOS）',
  'Official installer (macOS / Linux)': '官方安装脚本（macOS / Linux）',
  'Verify the binary': '验证安装',
  'Configure New API': '配置 New API',
  'Create an API key': '创建 API 密钥',
  'Sign in to this console, open Keys / Tokens, create a key, and copy it once.':
    '登录本控制台，打开密钥/令牌页面，创建并复制密钥。',
  'Prefer a dedicated key for CLI usage': '建议为 CLI 单独创建密钥',
  'Enable the models you plan to use with Codex':
    '为密钥启用计划在 Codex 中使用的模型',
  'Keep the key out of git and shared screenshots':
    '不要将密钥提交到 Git 或出现在截图中',
  'Environment variables (quick start)': '环境变量（快速开始）',
  'Point Codex at this gateway with OpenAI-compatible env vars. Replace the key with yours.':
    '使用 OpenAI 兼容环境变量将 Codex 指向本网关，请替换为你自己的密钥。',
  'bash / zsh': 'bash / zsh',
  PowerShell: 'PowerShell',
  'OPENAI_BASE_URL must include the /v1 suffix for OpenAI-compatible gateways.':
    '对接 OpenAI 兼容网关时，OPENAI_BASE_URL 必须包含 /v1 后缀。',
  'Persistent config (~/.codex/config.toml)':
    '持久配置（~/.codex/config.toml）',
  'Recommended for daily use. Provider settings belong in the user config, not project config.':
    '日常使用推荐此方式。供应商配置应写在用户级配置中，不要放在项目配置里。',
  '~/.codex/config.toml': '~/.codex/config.toml',
  Usage: '使用',
  'Start in a project directory': '在项目目录启动',
  'Useful first prompts': '实用首条提示词',
  'Summarize this repository structure': '总结这个仓库的结构',
  'Find the auth middleware and explain the flow':
    '找到认证中间件并解释其流程',
  'Add unit tests for the quota helper without changing public APIs':
    '为配额辅助函数补充单元测试，且不改动公开 API',
  'Install CLI': '安装 CLI',
  'npm, Homebrew, or official installer': 'npm、Homebrew 或官方安装脚本',
  'Set base URL + key': '设置 Base URL 与密钥',
  'OPENAI_BASE_URL → this gateway /v1': 'OPENAI_BASE_URL → 本网关 /v1',
  'auth.json + config.toml → this gateway /v1':
    'auth.json + config.toml → 本网关 /v1',
  'Run codex': '运行 codex',
  'Start coding with the agent in-terminal': '在终端中与 Agent 一起编程',

  'Codex home directory layout': 'Codex 主目录结构',
  'Codex stores user state under CODEX_HOME (default ~/.codex on macOS/Linux, %USERPROFILE%\\.codex on Windows). Credentials and provider routing are split into separate files.':
    'Codex 将用户状态保存在 CODEX_HOME（macOS/Linux 默认 ~/.codex，Windows 为 %USERPROFILE%\\.codex）。凭证与供应商路由分文件存放。',
  '~/.codex/auth.json — cached login / API-key credentials (sensitive)':
    '~/.codex/auth.json — 缓存的登录 / API Key 凭证（敏感）',
  '~/.codex/config.toml — models, providers, sandbox, MCP, and preferences':
    '~/.codex/config.toml — 模型、供应商、沙箱、MCP 与偏好设置',
  'Project overrides may live in <repo>/.codex/config.toml (trusted projects only)':
    '项目级覆盖可放在 <repo>/.codex/config.toml（仅受信任项目）',
  'Do not put secrets in project config or commit them to git':
    '不要把密钥写进项目配置或提交到 Git',
  'Inspect CODEX_HOME': '检查 CODEX_HOME',
  'auth.json': 'auth.json',
  'What auth.json is for': 'auth.json 的作用',
  'Codex never stores API keys inside config.toml. After login or API-key setup, credentials are cached in the OS keyring (preferred) or in ~/.codex/auth.json when file storage is used.':
    'Codex 不会把 API Key 写进 config.toml。登录或配置密钥后，凭证会缓存到系统钥匙串（优先）或文件模式的 ~/.codex/auth.json。',
  'auth_mode = "apiKey" — recommended when routing through New API':
    'auth_mode = "apiKey" — 对接 New API 时推荐',
  'auth_mode = "chatgpt" — official ChatGPT OAuth tokens (not for custom gateways)':
    'auth_mode = "chatgpt" — 官方 ChatGPT OAuth 令牌（不适合自定义网关）',
  'Treat auth.json like a password: mode 600, never commit, never paste into tickets':
    '把 auth.json 当密码对待：权限 600，禁止提交，禁止粘贴到工单',
  'If you switch from ChatGPT login to a New API key, rewrite auth.json or re-login':
    '若从 ChatGPT 登录切换到 New API 密钥，请重写 auth.json 或重新登录',
  'API-key mode for New API (recommended)': '面向 New API 的 API Key 模式（推荐）',
  'Use the key from this console. File-based storage is useful for headless machines and for inspecting what Codex will send.':
    '使用本控制台创建的密钥。文件存储便于无界面机器，也方便检查 Codex 实际使用的凭证。',
  '~/.codex/auth.json': '~/.codex/auth.json',
  'Create safely (bash)': '安全创建（bash）',
  'Prefer env OPENAI_API_KEY + config.toml provider env_key when possible. auth.json is mainly for cached credentials and CI seeding.':
    '优先使用环境变量 OPENAI_API_KEY + config.toml 中的 env_key。auth.json 主要用于缓存凭证与 CI 预置。',
  'ChatGPT OAuth mode (official only)': 'ChatGPT OAuth 模式（仅官方）',
  'If you previously ran codex login against ChatGPT, auth.json may look like the example below. This mode talks to OpenAI, not your New API gateway — switch to apiKey mode for gateway routing.':
    '若之前对 ChatGPT 执行过 codex login，auth.json 可能类似下方示例。该模式连接 OpenAI，不会走 New API——对接网关请改用 apiKey 模式。',
  'ChatGPT-style auth.json (do not use with New API)':
    'ChatGPT 风格 auth.json（请勿用于 New API）',
  'Choose credential store in config.toml': '在 config.toml 中选择凭证存储',
  'Control where credentials are written. file forces auth.json; keyring uses the OS secret store; auto prefers keyring when available.':
    '控制凭证写入位置。file 强制使用 auth.json；keyring 使用系统密钥库；auto 在可用时优先 keyring。',
  'Snippet for ~/.codex/config.toml': '~/.codex/config.toml 片段',
  'Login / logout helpers': '登录 / 登出辅助命令',
  'config.toml': 'config.toml',
  'Minimal New API provider config': '最小 New API 供应商配置',
  'Recommended daily setup: define a custom model provider that points at this gateway /v1, then select it with model_provider. Keep this in the user config (~/.codex/config.toml), not project config — project files cannot override provider/auth keys.':
    '日常推荐：定义指向本网关 /v1 的自定义供应商，再用 model_provider 选中。请写在用户级 ~/.codex/config.toml，不要写在项目配置——项目配置不能覆盖供应商/鉴权相关键。',
  'After editing, open a new shell so OPENAI_API_KEY is present, then run: codex':
    '修改后请新开终端确保 OPENAI_API_KEY 已生效，然后运行：codex',
  'Built-in openai provider override': '覆盖内置 openai 供应商',
  'If you prefer not to define a custom provider id, you can override the built-in openai base URL. Custom [model_providers.*] is still clearer for multi-provider setups.':
    '若不想自定义供应商 ID，可直接覆盖内置 openai 的 base URL。多供应商场景仍更推荐 [model_providers.*]。',
  'Alternative: openai_base_url': '备选：openai_base_url',
  'Useful optional keys': '常用可选配置项',
  'These keys are commonly adjusted for gateway and local workflows. Exact defaults depend on your Codex version — check the official config reference if a key is rejected.':
    '以下键常用于网关与本地工作流。默认值随 Codex 版本变化——若某键被拒绝，请查阅官方配置参考。',
  'approval_policy — untrusted | on-request | never':
    'approval_policy — untrusted | on-request | never',
  'sandbox_mode — read-only | workspace-write | danger-full-access':
    'sandbox_mode — read-only | workspace-write | danger-full-access',
  'model_reasoning_effort — minimal | low | medium | high | xhigh':
    'model_reasoning_effort — minimal | low | medium | high | xhigh',
  'disable_response_storage — avoid uploading conversation storage when unsupported':
    'disable_response_storage — 在不支持时避免上传会话存储',
  '[features] — experimental feature flags': '[features] — 实验特性开关',
  '[mcp_servers.*] — local MCP tool servers':
    '[mcp_servers.*] — 本地 MCP 工具服务',
  'Expanded example': '扩展示例',
  'Config precedence and profiles': '配置优先级与 Profile',
  'Closest trusted config wins, but provider/auth keys are restricted to user/system configs for safety.':
    '最近的受信任配置优先，但供应商/鉴权相关键为安全起见仅允许用户/系统配置覆盖。',
  'CLI flags / -c overrides win over files':
    'CLI 参数 / -c 覆盖优先于文件',
  'Trusted project .codex/config.toml can set local preferences only':
    '受信任项目的 .codex/config.toml 只能设置本地偏好',
  'Named profiles: ~/.codex/<name>.config.toml then codex --profile <name>':
    '命名 Profile：~/.codex/<name>.config.toml，然后 codex --profile <name>',
  'User ~/.codex/config.toml is the right place for New API base_url + model_provider':
    '用户级 ~/.codex/config.toml 是放置 New API base_url + model_provider 的正确位置',
  'System /etc/codex/config.toml and requirements.toml may lock enterprise settings':
    '系统级 /etc/codex/config.toml 与 requirements.toml 可能锁定企业设置',
  'Validate / edit helpers': '校验 / 编辑辅助命令',

  'Powered by Claude models': '由 Claude 模型驱动',
  'Claude Code configuration tutorial': 'Claude Code 配置教程',
  'Connect Anthropic Claude Code to this New API gateway via ANTHROPIC_BASE_URL and your console API key.':
    '通过 ANTHROPIC_BASE_URL 与控制台 API 密钥，将 Claude Code 连接到本 New API 网关。',
  'Pair-programming agent': '结对编程 Agent',
  'Beyond autocomplete — Claude Code plans, edits, and runs tasks against your full repo context.':
    '不止代码补全——Claude Code 可基于完整仓库上下文进行规划、编辑与执行任务。',
  'Deep codebase understanding': '深度代码库理解',
  'Refactors, reviews, tests, and docs with awareness of project layout and conventions.':
    '在理解项目结构与约定的基础上进行重构、审查、测试与文档编写。',
  'Gateway-friendly auth': '网关友好鉴权',
  'Official LLM-gateway mode via ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN / API key.':
    '通过 ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN / API Key 使用官方网关模式。',
  'Terminal-native': '终端原生体验',
  'Stay in the shell: inspect files, run builds, and iterate without leaving the CLI.':
    '留在终端：检查文件、运行构建并持续迭代，无需离开 CLI。',
  '@anthropic-ai/claude-code': '@anthropic-ai/claude-code',
  'Anthropic Messages API (/v1/messages)':
    'Anthropic Messages API（/v1/messages）',
  'Install Claude Code': '安装 Claude Code',
  Verify: '验证',
  'Open Keys / Tokens in this console': '在本控制台打开密钥/令牌页面',
  'Create a key with access to Claude-compatible models':
    '创建可访问 Claude 兼容模型的密钥',
  'Copy the key for local configuration only': '仅在本地配置中复制使用密钥',
  'Environment variables': '环境变量',
  'Claude Code appends /v1/messages itself. Set ANTHROPIC_BASE_URL to the site origin (no trailing /v1). Prefer ANTHROPIC_AUTH_TOKEN for Bearer auth used by most gateways.':
    'Claude Code 会自行拼接 /v1/messages。请将 ANTHROPIC_BASE_URL 设为站点源地址（不要带 /v1）。多数网关推荐使用 ANTHROPIC_AUTH_TOKEN（Bearer）。',
  'Do not append /v1 to ANTHROPIC_BASE_URL — the client adds the Anthropic path segments.':
    '不要在 ANTHROPIC_BASE_URL 后追加 /v1——客户端会自动添加 Anthropic 路径。',
  'Persistent settings (~/.claude/settings.json)':
    '持久设置（~/.claude/settings.json）',
  'User-level env block applies to every Claude Code launch on this machine.':
    '用户级 env 配置会作用于本机所有 Claude Code 启动。',
  '~/.claude/settings.json': '~/.claude/settings.json',
  'VS Code extension': 'VS Code 扩展',
  'If you use the Claude Code VS Code extension, set the same variables in extension settings for reliable gateway routing.':
    '若使用 Claude Code VS Code 扩展，请在扩展设置中配置相同变量以确保网关路由生效。',
  'settings.json': 'settings.json',
  'Launch and verify routing': '启动并验证路由',
  'Start Claude Code, then run /status and confirm the Anthropic base URL shows this gateway.':
    '启动 Claude Code，执行 /status，确认 Anthropic base URL 指向本网关。',
  'Example tasks': '示例任务',
  'Refactor the authentication module and keep public APIs stable':
    '重构认证模块并保持公开 API 稳定',
  'Generate unit tests for the billing math helpers':
    '为计费数学辅助函数生成单元测试',
  'Review this PR for race conditions and missing error handling':
    '审查该 PR 是否存在竞态条件与缺失错误处理',
  'npm install -g @anthropic-ai/claude-code':
    'npm install -g @anthropic-ai/claude-code',
  'Set gateway env': '设置网关环境变量',
  'ANTHROPIC_BASE_URL + auth token': 'ANTHROPIC_BASE_URL + 鉴权令牌',
  'Run claude': '运行 claude',
  'Confirm /status then start coding': '确认 /status 后开始编码',

  'Powered by Grok / xAI models': '由 Grok / xAI 模型驱动',
  'Grok CLI configuration tutorial': 'Grok CLI 配置教程',
  'Install the Grok coding CLI and route OpenAI-compatible traffic through this New API instance.':
    '安装 Grok 编程 CLI，并将 OpenAI 兼容流量路由到本 New API 实例。',
  'Grok coding agent': 'Grok 编程 Agent',
  'Interactive TUI and headless modes for repo exploration, edits, and long-running tasks.':
    '交互式 TUI 与无头模式，用于仓库探索、编辑与长任务。',
  'Strong reasoning models': '强推理模型',
  'Use Grok-family models exposed by your New API channels for planning and implementation.':
    '使用 New API 渠道中的 Grok 系列模型进行规划与实现。',
  'TOML model config': 'TOML 模型配置',
  'Define custom providers with base_url + env_key in ~/.grok/config.toml.':
    '在 ~/.grok/config.toml 中通过 base_url + env_key 定义自定义供应商。',
  'Headless automation': '无头自动化',
  'Run one-shot prompts with -p for CI scripts and unattended workflows.':
    '使用 -p 运行一次性提示词，适用于 CI 与无人值守流程。',
  'CLI install': 'CLI 安装',
  'Official xAI installer or community CLIs': '官方 xAI 安装脚本或社区 CLI',
  'API style': 'API 风格',
  'OpenAI-compatible endpoint via New API /v1':
    '经 New API /v1 的 OpenAI 兼容端点',
  Config: '配置',
  '~/.grok/config.toml': '~/.grok/config.toml',
  'Official Grok Build CLI': '官方 Grok Build CLI',
  'macOS / Linux': 'macOS / Linux',
  'Windows (PowerShell)': 'Windows（PowerShell）',
  'If the official binary is unavailable in your region, use any OpenAI-compatible coding CLI against the same /v1 base URL.':
    '若当前环境无法使用官方二进制，可用任意 OpenAI 兼容编程 CLI 对接同一 /v1 地址。',
  'Community Grok CLI (optional)': '社区 Grok CLI（可选）',
  'Popular open-source alternative with similar env-based configuration.':
    '流行的开源替代方案，配置方式类似（环境变量）。',
  'Create a token in this console': '在本控制台创建令牌',
  'Enable Grok / xAI (or compatible) models on the key':
    '为密钥启用 Grok / xAI（或兼容）模型',
  'Store the key in an environment variable': '将密钥保存在环境变量中',
  'Custom provider in ~/.grok/config.toml':
    '在 ~/.grok/config.toml 中自定义供应商',
  'Point the CLI at this OpenAI-compatible gateway. Adjust model IDs to match models available on your New API instance.':
    '将 CLI 指向本 OpenAI 兼容网关。模型 ID 需与 New API 实例中可用模型一致。',
  'Use the OpenAI-compatible /v1 base URL. Model IDs must match what your channels expose.':
    '使用 OpenAI 兼容的 /v1 Base URL。模型 ID 必须与渠道暴露的名称一致。',
  'Interactive and headless modes': '交互式与无头模式',
  'Interactive TUI': '交互式 TUI',
  'One-shot prompt': '一次性提示词',
  'Inspect configuration': '检查配置',
  'Use built-in inspect/status commands when available to confirm base_url and selected model.':
    '在可用时使用内置 inspect/status 命令确认 base_url 与所选模型。',
  'Install Grok CLI': '安装 Grok CLI',
  'Official installer or community CLI': '官方安装脚本或社区 CLI',
  'Wire New API': '接入 New API',
  'XAI_API_KEY + base_url=/v1': 'XAI_API_KEY + base_url=/v1',
  'auth.json + config.toml → /v1': 'auth.json + config.toml → /v1',
  'Start grok': '启动 grok',
  'Interactive TUI or headless -p mode': '交互式 TUI 或无头 -p 模式',

  'Grok home directory layout': 'Grok 主目录结构',
  'Official Grok Build CLI stores state under ~/.grok (Windows: %USERPROFILE%\\.grok). Auth and model routing are separate files.':
    '官方 Grok Build CLI 将状态保存在 ~/.grok（Windows：%USERPROFILE%\\.grok）。鉴权与模型路由分文件存放。',
  '~/.grok/auth.json — OAuth/session tokens and optional cached API keys (sensitive)':
    '~/.grok/auth.json — OAuth/会话令牌与可选缓存的 API Key（敏感）',
  '~/.grok/config.toml — models, endpoints, UI, permissions, marketplace':
    '~/.grok/config.toml — 模型、端点、UI、权限、市场配置',
  'Project overrides may appear as ./.grok/config.toml in the working directory':
    '项目级覆盖可能出现在工作目录的 ./.grok/config.toml',
  'Managed enterprise layers may also load managed_config.toml / requirements.toml':
    '企业托管层还可能加载 managed_config.toml / requirements.toml',
  'Inspect ~/.grok': '检查 ~/.grok',
  'Grok Build writes authentication state to ~/.grok/auth.json after browser/device login. The file is intentionally opaque and should be treated as a secret store, not hand-edited for OAuth tokens.':
    '浏览器/设备码登录后，Grok Build 会把鉴权状态写入 ~/.grok/auth.json。该文件有意保持不透明，应视为密钥库，不要手改 OAuth 令牌。',
  'Browser OIDC: grok login → tokens cached in auth.json (auto-refresh)':
    '浏览器 OIDC：grok login → 令牌缓存到 auth.json（自动刷新）',
  'Device code: grok login --device-auth for SSH / headless terminals':
    '设备码：SSH / 无界面环境使用 grok login --device-auth',
  'API key path for New API / CI: prefer XAI_API_KEY env or model.env_key / model.api_key in config.toml':
    '对接 New API / CI 的 API Key 路径：优先 XAI_API_KEY 环境变量，或 config.toml 中的 model.env_key / model.api_key',
  'Never commit auth.json; keep directory permissions tight':
    '永远不要提交 auth.json；保持目录权限收紧',
  'Typical auth.json shape': 'auth.json 典型结构',
  'Exact keys evolve with the CLI. You may see OAuth host entries plus an optional XAI_API_KEY cache. Do not share real tokens — the sample below uses placeholders only.':
    '具体字段会随 CLI 版本变化。你可能看到 OAuth 主机条目以及可选的 XAI_API_KEY 缓存。不要分享真实令牌——下方示例仅为占位。',
  '~/.grok/auth.json (illustrative)': '~/.grok/auth.json（示意）',
  'Safe inspection (no secret dump)': '安全检查（不打印密钥）',
  'For New API gateways, do not rely on xAI OAuth in auth.json. Use your console API key via env or config.toml model credentials.':
    '对接 New API 时，不要依赖 auth.json 里的 xAI OAuth。请用控制台 API Key（环境变量或 config.toml 模型凭证）。',
  'Credential resolution order': '凭证解析顺序',
  'When a model is selected, Grok resolves credentials roughly in this order (highest first). Knowing the order prevents “wrong account” surprises.':
    '选定模型后，Grok 大致按以下优先级解析凭证（越高越优先）。了解顺序可避免“用了错误账号”的情况。',
  'model.api_key inside ~/.grok/config.toml (highest, least portable)':
    'config.toml 中的 model.api_key（最高优先级，最不便于迁移）',
  'model.env_key → value of that environment variable':
    'model.env_key → 对应环境变量的值',
  'Active session token from auth.json (official xAI login)':
    'auth.json 中的活跃会话令牌（官方 xAI 登录）',
  'XAI_API_KEY environment variable (good default for New API / CI)':
    'XAI_API_KEY 环境变量（New API / CI 的良好默认）',
  'Login helpers': '登录辅助命令',
  'Minimal New API model config': '最小 New API 模型配置',
  'Define a custom model entry that points base_url at this gateway /v1, then set it as default. Model IDs must match models enabled on your New API channels.':
    '定义 base_url 指向本网关 /v1 的自定义模型条目，并设为默认。模型 ID 必须与 New API 渠道中启用的模型一致。',
  'Use the OpenAI-compatible /v1 base URL. After saving, run: export XAI_API_KEY=... && grok inspect':
    '使用 OpenAI 兼容的 /v1 Base URL。保存后执行：export XAI_API_KEY=... && grok inspect',
  'UI, permissions, and CLI behavior': 'UI、权限与 CLI 行为',
  'These sections control the TUI experience and automation safety. They are independent from model routing.':
    '这些段控制 TUI 体验与自动化安全，与模型路由相互独立。',
  'Common companion sections': '常用配套配置段',
  'Full gateway-oriented example': '完整网关向示例',
  'A practical template for routing Grok Build through New API while keeping secrets in the environment.':
    '将 Grok Build 路由到 New API，并把密钥留在环境变量中的实用模板。',
  'Copy-ready template': '可直接复制的模板',
  'Config load order': '配置加载顺序',
  'Grok merges several layers. Higher-priority managed/requirements files can pin enterprise policy and block overrides.':
    'Grok 会合并多层配置。更高优先级的 managed/requirements 文件可锁定企业策略并阻止覆盖。',
  'Lowest: /etc/grok/managed_config.toml':
    '最低：/etc/grok/managed_config.toml',
  'Then: ~/.grok/managed_config.toml': '然后：~/.grok/managed_config.toml',
  'Then: ~/.grok/config.toml (your daily settings)':
    '然后：~/.grok/config.toml（日常设置）',
  'Then: requirements.toml layers that pin non-overridable keys':
    '然后：锁定不可覆盖键的 requirements.toml 层',
  'Project ./.grok/config.toml may add workspace preferences':
    '项目 ./.grok/config.toml 可补充工作区偏好',
  'Verify loaded config': '验证已加载配置',

  'Powered by Google Gemini': '由 Google Gemini 驱动',
  'Gemini CLI configuration tutorial': 'Gemini CLI 配置教程',
  'Install Google Gemini CLI and override GOOGLE_GEMINI_BASE_URL so traffic goes through this New API gateway.':
    '安装 Google Gemini CLI，并覆盖 GOOGLE_GEMINI_BASE_URL，使流量经过本 New API 网关。',
  'Large context window': '超大上下文窗口',
  'Gemini models handle large codebases and multi-file reasoning in a single session.':
    'Gemini 模型可在单次会话中处理大型代码库与多文件推理。',
  'Agent-style workflows': 'Agent 工作流',
  'Plan tasks, edit files, and iterate with the official Google Gemini CLI agent loop.':
    '使用官方 Google Gemini CLI Agent 循环规划任务、编辑文件并迭代。',
  'Multimodal ready': '多模态就绪',
  'Work with text and images when your upstream Gemini channel supports it.':
    '当上游 Gemini 渠道支持时，可处理文本与图像。',
  'Custom base URL': '自定义 Base URL',
  'GOOGLE_GEMINI_BASE_URL redirects Gemini API-key traffic to New API /v1beta paths.':
    'GOOGLE_GEMINI_BASE_URL 可将 Gemini API Key 流量重定向到 New API 的 /v1beta 路径。',
  '@google/gemini-cli': '@google/gemini-cli',
  'Gemini API (/v1beta/models/...)': 'Gemini API（/v1beta/models/...）',
  'Install Gemini CLI': '安装 Gemini CLI',
  'npx (no install)': 'npx（无需安装）',
  'Ensure Gemini-compatible models are enabled':
    '确保已启用 Gemini 兼容模型',
  'Use API-key auth in Gemini CLI (not Google account OAuth)':
    '在 Gemini CLI 中使用 API Key 鉴权（不要用 Google 账号 OAuth）',
  'Set the host root as GOOGLE_GEMINI_BASE_URL. Gemini CLI will call /v1beta/... on that host. New API exposes Gemini-compatible routes under /v1beta.':
    '将主机根地址设为 GOOGLE_GEMINI_BASE_URL。Gemini CLI 会请求该主机上的 /v1beta/...。New API 在 /v1beta 下提供 Gemini 兼容路由。',
  'Choose “Use Gemini API Key” auth. Google login may ignore custom base URLs.':
    '请选择「使用 Gemini API Key」鉴权。Google 登录可能会忽略自定义 Base URL。',
  'Optional .env file': '可选 .env 文件',
  'Gemini CLI loads dotenv from the project directory or home directory.':
    'Gemini CLI 会从项目目录或用户主目录加载 dotenv。',
  '.env': '.env',
  'Start Gemini CLI': '启动 Gemini CLI',
  'Example prompts': '示例提示词',
  'Map the frontend routing structure and list public pages':
    '梳理前端路由结构并列出公开页面',
  'Propose a safer quota conversion helper with tests':
    '提出更安全的配额转换辅助函数并附测试',
  'Generate a migration checklist for this feature module':
    '为该功能模块生成迁移检查清单',
  'npm install -g @google/gemini-cli': 'npm install -g @google/gemini-cli',
  'GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY':
    'GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY',
  'Run gemini': '运行 gemini',
  'API key auth against this gateway': '使用 API Key 对接本网关',
}

function identityBundle(source: Record<string, string>) {
  return Object.fromEntries(
    Object.keys(source).map((key) => [key, key])
  ) as Record<string, string>
}

export const docsI18nResources = {
  en: { translation: { ...en } },
  zhCN: { translation: zhCN },
  zhTW: {
    translation: {
      ...identityBundle(en),
      'Configuration tutorials': '設定教學',
      'Vibe coding tool tutorials': 'Vibe Coding 工具教學',
      'Open guide': '開啟教學',
      'All tutorials': '全部教學',
      'Get API key': '取得 API Key',
      'Feature overview': '功能概覽',
      'Setup guide': '設定指南',
      'Ready to start?': '準備好開始了嗎？',
      'Official documentation': '官方文件',
    },
  },
  fr: {
    translation: {
      ...identityBundle(en),
      'Configuration tutorials': 'Tutoriels de configuration',
      'Vibe coding tool tutorials': 'Tutoriels des outils vibe coding',
      'Open guide': 'Ouvrir le guide',
      'All tutorials': 'Tous les tutoriels',
      'Get API key': 'Obtenir une clé API',
      'Feature overview': "Vue d'ensemble",
      'Setup guide': 'Guide de configuration',
      'Ready to start?': 'Prêt à commencer ?',
    },
  },
  ru: {
    translation: {
      ...identityBundle(en),
      'Configuration tutorials': 'Учебники по настройке',
      'Vibe coding tool tutorials': 'Учебники vibe coding инструментов',
      'Open guide': 'Открыть руководство',
      'All tutorials': 'Все учебники',
      'Get API key': 'Получить API-ключ',
      'Feature overview': 'Обзор возможностей',
      'Setup guide': 'Руководство по настройке',
      'Ready to start?': 'Готовы начать?',
    },
  },
  ja: {
    translation: {
      ...identityBundle(en),
      'Configuration tutorials': '設定チュートリアル',
      'Vibe coding tool tutorials': 'Vibe Coding ツールのチュートリアル',
      'Open guide': 'ガイドを開く',
      'All tutorials': 'すべてのチュートリアル',
      'Get API key': 'API キーを取得',
      'Feature overview': '機能概要',
      'Setup guide': 'セットアップガイド',
      'Ready to start?': '始める準備はできましたか？',
    },
  },
  vi: {
    translation: {
      ...identityBundle(en),
      'Configuration tutorials': 'Hướng dẫn cấu hình',
      'Vibe coding tool tutorials': 'Hướng dẫn công cụ vibe coding',
      'Open guide': 'Mở hướng dẫn',
      'All tutorials': 'Tất cả hướng dẫn',
      'Get API key': 'Lấy API key',
      'Feature overview': 'Tổng quan tính năng',
      'Setup guide': 'Hướng dẫn thiết lập',
      'Ready to start?': 'Sẵn sàng bắt đầu?',
    },
  },
} as const
