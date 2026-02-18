# ContextDAO MCP Server

Agent-native interface to the ContextDAO cognitive asset marketplace.

## Tools

| Tool | Description |
|------|-------------|
| `search_skills` | Search marketplace by query, category, or max price |
| `get_skill_detail` | Get full metadata + pricing for a specific skill |
| `preview_skill` | Free demo inference (1 per skill per day) |
| `purchase_skill` | Buy (get .md source) or Rent (blind inference) a skill |
| `list_owned_skills` | List skills purchased in this session |

## Installation

### Claude Code (local)

```bash
cd mcp-server && npm install && npm run build
```

Then add to your Claude Code config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "context-dao": {
      "command": "node",
      "args": ["/absolute/path/to/context-dao/mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/context-dao"
    }
  }
}
```

### Environment Variables

For `preview_skill` and `purchase_skill` (rent mode) to work, set:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Demo Flow

```
User: "I need help with Spanish crypto taxes"
Agent: [calls search_skills({ query: "spanish crypto tax" })]
Agent: "Found 'Spanish Crypto Tax Advisor' — 94% accuracy, $0.05/call"
User: "Try it out"
Agent: [calls preview_skill({ slug: "spanish-crypto-tax", test_prompt: "Do I owe taxes on staking rewards?" })]
Agent: "Here's the preview response. Want to rent it for a full answer?"
User: "Yes"
Agent: [calls purchase_skill({ slug: "spanish-crypto-tax", mode: "rent", prompt: "..." })]
```
