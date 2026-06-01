export interface ToolStep {
  title: string;
  description: string;
  code?: string;
}

export interface ToolFeature {
  title: string;
  description: string;
  iconColor: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  subtitle: string;
  badgeText: string;
  badgeGradient: string;
  accentGradient: string;
  features: ToolFeature[];
  installSteps: ToolStep[];
  apiKeySteps: ToolStep[];
  tutorialSteps: ToolStep[];
  terminalDemo: {
    prompt: string;
    response: string;
    followUp?: string;
    followUpResponse?: string;
  };
  ctaSteps: { title: string; description: string }[];
  externalLinks?: { label: string; url: string }[];
}

export const TOOLS: ToolConfig[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    subtitle:
      "Not just code completion, but a true pair-programming partner. Run directly in your terminal, deeply understand project context, and automate tedious tasks.",
    badgeText: "Claude 4.5 Sonnet Powered",
    badgeGradient: "from-blue-500 to-purple-600",
    accentGradient: "from-blue-500 to-purple-600",
    features: [
      {
        title: "Smart Code Generation",
        description:
          "Quickly generate high-quality, maintainable code snippets and complete modules powered by Claude 3.7 Sonnet",
        iconColor: "text-blue-500",
      },
      {
        title: "Deep Code Analysis",
        description:
          "Deeply understand existing codebase structure, provide precise refactoring suggestions and architecture optimization",
        iconColor: "text-green-500",
      },
      {
        title: "Smart Debugging",
        description:
          "Automatically locate bug root causes, provide fix suggestions, and even generate fix code directly",
        iconColor: "text-purple-500",
      },
      {
        title: "Automated Documentation",
        description:
          "One-click generation of clear, standardized code documentation and API descriptions",
        iconColor: "text-orange-500",
      },
      {
        title: "CLI Integration",
        description:
          "Powerful CLI tool that seamlessly integrates AI assistant into your terminal workflow",
        iconColor: "text-cyan-500",
      },
    ],
    installSteps: [
      {
        title: "Install CLI Tool",
        description: "Supports Windows, macOS, Linux",
        code: "npm install -g @anthropic-ai/claude-code",
      },
      {
        title: "Verify Installation",
        description: "Check the installed version",
        code: "claude --version",
      },
    ],
    apiKeySteps: [
      {
        title: "Get API Key",
        description: "Register on the platform and create a new API Key in the API management page",
      },
      {
        title: "Configure Environment",
        description: "Set environment variable for secure access",
        code: 'export ANTHROPIC_API_KEY="your-api-key"',
      },
      {
        title: "Set API Endpoint",
        description: "Configure the custom endpoint address",
      },
    ],
    tutorialSteps: [
      {
        title: "Start Claude",
        description: "Launch Claude Code in your terminal",
        code: "claude",
      },
      {
        title: "Ask Questions",
        description: "Describe what you need help with in natural language",
      },
      {
        title: "Advanced Features",
        description: "Code review, unit tests, documentation generation, performance optimization",
      },
    ],
    terminalDemo: {
      prompt: "$ claude",
      response: "Hello! I'm Claude Code. How can I help you with your project today?",
      followUp: "Refactor the user authentication module",
      followUpResponse:
        "I'll help you refactor the auth module. First, let me analyze the current implementation in src/auth...",
    },
    ctaSteps: [
      { title: "Install CLI Tool", description: "Supports Windows, macOS, Linux" },
      { title: "Configure API Key", description: "Connect to the API service" },
      { title: "Start Claude Code", description: "Begin AI pair-programming" },
    ],
  },
  {
    id: "codex-code",
    name: "CodeX",
    subtitle:
      "Not just code completion, but a true pair-programming partner. Powered by GPT-5.2, providing deep code analysis and smart refactoring capabilities.",
    badgeText: "GPT-5.2 Powered",
    badgeGradient: "from-green-500 to-emerald-600",
    accentGradient: "from-green-500 to-emerald-600",
    features: [
      {
        title: "Smart Code Generation",
        description: "High-quality code generation and intelligent completion based on GPT-5.2",
        iconColor: "text-blue-500",
      },
      {
        title: "Deep Analysis",
        description: "Deep analysis and understanding of entire codebase structure",
        iconColor: "text-green-500",
      },
      {
        title: "Smart Refactoring",
        description: "Intelligently refactor code, applying best design patterns",
        iconColor: "text-purple-500",
      },
      {
        title: "Git Integration",
        description: "Automatically generate commit messages and code reviews",
        iconColor: "text-orange-500",
      },
      {
        title: "GPT-5.2 Powered",
        description: "Enterprise-grade AI programming assistant with powerful reasoning",
        iconColor: "text-cyan-500",
      },
    ],
    installSteps: [
      {
        title: "Install CLI Tool",
        description: "Install CodeX command line tool globally",
        code: "npm install -g @codex/cli",
      },
      {
        title: "Verify Installation",
        description: "Check the installed version",
        code: "codex --version",
      },
    ],
    apiKeySteps: [
      {
        title: "Get API Key",
        description: "Obtain your API Key from the platform",
      },
      {
        title: "Configure VSCode Extension",
        description: "Install and configure the CodeX Assistant extension in VSCode",
      },
      {
        title: "Set API Endpoint",
        description: "Configure the custom endpoint address in extension settings",
      },
    ],
    tutorialSteps: [
      {
        title: "Launch CodeX",
        description: "Start CodeX CLI in your terminal",
        code: "codex",
      },
      {
        title: "Analyze Project",
        description: "Let CodeX scan and understand your project structure",
      },
      {
        title: "Smart Refactoring",
        description: "Use CodeX to refactor code with best practices",
      },
    ],
    terminalDemo: {
      prompt: "$ codex",
      response: "CodeX CLI v2.0.0 - Powered by GPT-5",
      followUp: "Analyze the current project structure",
      followUpResponse:
        'Scanning project files... Found 124 files. Project structure analysis complete. Detected React + Vite configuration.',
    },
    ctaSteps: [
      { title: "Environment Setup", description: "Install CLI tools and dependencies" },
      { title: "VSCode Configuration", description: "Configure IDE plugin and shortcuts" },
    ],
  },
  {
    id: "gemini-code",
    name: "Gemini Code",
    subtitle:
      "1M tokens ultra-large context window with multimodal input support. Built-in Agent Mode and Google Search, redefining AI-assisted programming.",
    badgeText: "Gemini 3 Pro Powered",
    badgeGradient: "from-purple-500 to-pink-600",
    accentGradient: "from-purple-500 to-pink-600",
    features: [
      {
        title: "Ultra-large Context Window",
        description: "1M tokens context, handling ultra-large scale projects",
        iconColor: "text-purple-500",
      },
      {
        title: "Agent Mode",
        description: "Automatically plan tasks, intelligently execute complex operations",
        iconColor: "text-blue-500",
      },
      {
        title: "Google Search",
        description: "Real-time web search for the latest information",
        iconColor: "text-green-500",
      },
      {
        title: "Git Integration",
        description: "Automatically generate commit messages and code reviews",
        iconColor: "text-orange-500",
      },
      {
        title: "Gemini 3 Pro",
        description: "Powered by Google AI's latest model",
        iconColor: "text-cyan-500",
      },
    ],
    installSteps: [
      {
        title: "Install CLI",
        description: "Install Gemini command line tool",
        code: "npm install -g @google/gemini-cli",
      },
      {
        title: "Verify Installation",
        description: "Check the installed version",
        code: "gemini --version",
      },
    ],
    apiKeySteps: [
      {
        title: "Get API Key",
        description: "Obtain your Google AI API Key from the platform",
      },
      {
        title: "Run Configure",
        description: "Run gemini configure command and enter API Key with custom endpoint",
        code: "gemini configure",
      },
      {
        title: "Set Environment Variable",
        description: "Optionally set GOOGLE_API_KEY environment variable",
        code: 'export GOOGLE_API_KEY="your-api-key"',
      },
    ],
    tutorialSteps: [
      {
        title: "Start Gemini",
        description: "Launch Gemini CLI",
        code: "gemini",
      },
      {
        title: "Multimodal Input",
        description: "Gemini supports text, image, and code input",
      },
      {
        title: "Agent Mode",
        description: "Use agent mode for complex multi-step tasks",
        code: 'gemini agent --task "Analyze this image"',
      },
    ],
    terminalDemo: {
      prompt: '$ gemini agent --task "Analyze this image"',
      response:
        "Analyzing image content... I see a UI design for a login page. It contains email/password fields and a \"Sign In\" button.",
      followUp: "Generate React code for this UI",
      followUpResponse: 'Generating React component... "Done! Created `LoginPage.tsx`"',
    },
    ctaSteps: [
      { title: "Install CLI", description: "Install Gemini command line tool" },
      { title: "Configure Key", description: "Configure API key and environment variables" },
      { title: "Start Coding", description: "Launch Gemini CLI" },
    ],
  },
  {
    id: "open-claw",
    name: "OpenClaw",
    subtitle:
      "An AI agent gateway that connects chat applications with agents through a single gateway process, managing sessions, routing, and channel configuration.",
    badgeText: "OpenClaw Gateway",
    badgeGradient: "from-blue-500 to-purple-600",
    accentGradient: "from-blue-500 to-purple-600",
    features: [
      {
        title: "Multi-channel Gateway",
        description:
          "Connect WhatsApp, Telegram, Discord, iMessage and more through a single Gateway process",
        iconColor: "text-blue-500",
      },
      {
        title: "Multi-agent Routing",
        description:
          "Isolate sessions by agent, workspace, or sender for multi-user and multi-task scenarios",
        iconColor: "text-green-500",
      },
      {
        title: "Web Control Panel",
        description:
          "Manage chats, configuration, sessions and nodes in the browser for daily operations",
        iconColor: "text-purple-500",
      },
      {
        title: "Media & Plugin Extensions",
        description:
          "Support images, audio, documents, and extend more messaging channels via plugins",
        iconColor: "text-orange-500",
      },
    ],
    installSteps: [
      {
        title: "Install CLI Tool",
        description: "Supports Windows, macOS, Linux",
        code: "npm install -g openclaw",
      },
      {
        title: "Verify Installation",
        description: "Check the installed version",
        code: "openclaw --version",
      },
    ],
    apiKeySteps: [
      {
        title: "Prepare API Parameters",
        description: "Gather endpoint URL, API key, API protocol, model ID, and default model route",
      },
      {
        title: "Edit Configuration",
        description: "Write provider info into ~/.openclaw/openclaw.json",
        code: "~/.openclaw/openclaw.json",
      },
      {
        title: "Verify Configuration",
        description: "Start OpenClaw to verify the configuration is effective",
        code: "openclaw",
      },
    ],
    tutorialSteps: [
      {
        title: "Start OpenClaw",
        description: "Launch OpenClaw CLI",
        code: "openclaw",
      },
      {
        title: "Basic Usage",
        description: "Describe what you need help with in natural language",
      },
      {
        title: "Advanced Features",
        description: "Code review, unit tests, documentation generation, performance optimization",
      },
    ],
    terminalDemo: {
      prompt: "$ openclaw",
      response: "Hello! I'm OpenClaw. How can I help you with your project today?",
      followUp: "Refactor the user authentication module",
      followUpResponse:
        "I'll help you refactor the auth module. First, let me analyze the current implementation in src/auth...",
    },
    ctaSteps: [
      { title: "Install CLI Tool", description: "Supports Windows, macOS, Linux" },
      { title: "Configure API Key", description: "Edit openclaw.json and set default model" },
      { title: "Start OpenClaw", description: "Begin AI pair-programming" },
    ],
    externalLinks: [
      { label: "Official Website", url: "https://openclaw.ai/" },
      { label: "Documentation", url: "https://docs.openclaw.ai/start/getting-started" },
    ],
  },
];

export const VALID_TOOL_IDS = TOOLS.map((t) => t.id);

export function getToolConfig(toolId: string): ToolConfig | undefined {
  return TOOLS.find((t) => t.id === toolId);
}
