# ContextDAO Skill Format Specification

## Overview

A **Cognitive Asset** (skill) is a `.md` file containing a high-performance system prompt with YAML frontmatter metadata. Skills are the atomic unit of the ContextDAO marketplace — they can be bought (source access), rented (blind inference), and optimized (validation league).

## Skill Structure

```
skills/
├── schema/
│   ├── skill-metadata.schema.json      # JSON Schema for frontmatter
│   └── validation-set.schema.json      # JSON Schema for validation sets
├── your-skill-name/
│   ├── skill.md                        # The cognitive asset
│   └── validation.json                 # Test suite for scoring
```

## Skill File Format (`skill.md`)

Every skill file has two parts:

### 1. YAML Frontmatter (Metadata)

```yaml
---
name: "Skill Display Name"
version: "1.0.0"                # semver
author: "github-username"
description: "What this skill does (max 500 chars)"
category: "domain/subdomain"    # e.g., "finance/tax", "development/review"
price_buy: 50.00                # USD — one-time source access
price_rent: 0.02                # USD — per blind inference call
token_estimate: 1200            # approximate system prompt token count
accuracy_score: null            # set by Validation League (0-100)
created: "2026-02-18"           # ISO 8601
tags: ["tag1", "tag2"]          # max 10, lowercase, alphanumeric + hyphens
model_preference: "claude-sonnet-4-6"  # optional: recommended model
license: "proprietary"          # proprietary | cc-by-4.0 | cc-by-sa-4.0 | cc-by-nc-4.0 | mit
---
```

### 2. System Prompt (Content)

Everything after the frontmatter closing `---` is the system prompt. This is injected into the LLM as the system message during blind inference.

Write it as if you're writing a system prompt for Claude, GPT-4, or any instruction-following model.

## Validation Set Format (`validation.json`)

Each skill includes a companion test suite used by the Validation League to score performance.

```json
{
  "skill": "skill-directory-name",
  "version": "1.0.0",
  "questions": [
    {
      "input": "User prompt to test",
      "expected_output": "contains: keyword1, keyword2, keyword3",
      "match_type": "keyword",
      "weight": 1.0
    }
  ]
}
```

### Match Types

| Type | Description | Use When |
|------|-------------|----------|
| `keyword` | Checks if response contains specified keywords (comma-separated after `contains:`) | Factual answers with known terms |
| `exact` | Response must exactly match expected output | Numerical / deterministic answers |
| `contains` | Response must contain the exact substring | Checking for specific phrases |
| `llm_judge` | An LLM rates response quality against expected criteria (1-10) | Nuanced, subjective quality |

### Weight

- Default: `1.0`
- Higher weight = more influence on final score
- Use `2.0` for critical safety/boundary tests (e.g., "does it refuse to give medical advice?")

## Categories

Hierarchical, slash-separated, lowercase:

| Category | Examples |
|----------|---------|
| `finance/tax` | Tax advisors, financial analysis |
| `finance/trading` | Trading strategies, market analysis |
| `development/review` | Code review, architecture review |
| `development/debug` | Debugging, error analysis |
| `persona/philosophy` | Philosophical advisors, historical figures |
| `persona/coaching` | Life coaching, career advice |
| `data/analysis` | Data science, statistics |
| `legal/compliance` | Regulatory, compliance checks |
| `writing/technical` | Documentation, technical writing |
| `writing/creative` | Copywriting, storytelling |

## Pricing Guidelines

| Skill Complexity | Buy Price | Rent Price |
|-----------------|-----------|------------|
| Simple persona | $1–10 | $0.005–0.02 |
| Domain knowledge | $25–100 | $0.02–0.10 |
| Enterprise/specialized | $100–500 | $0.10–0.50 |

Rent pricing should cover LLM API cost + margin. Token estimate helps buyers calculate total inference cost.

## Creating a New Skill

1. Create a directory: `skills/your-skill-name/`
2. Write `skill.md` with YAML frontmatter + system prompt
3. Write `validation.json` with 10+ test questions
4. Validate against schemas in `skills/schema/`
5. Submit to the marketplace

## Sample Skills

| Skill | Category | Buy | Rent | Description |
|-------|----------|-----|------|-------------|
| [Stoic Philosopher](./stoic-philosopher/) | persona/philosophy | $5 | $0.01 | Practical Stoic wisdom from Aurelius, Epictetus, Seneca |
| [Spanish Crypto Tax](./spanish-crypto-tax/) | finance/tax | $50 | $0.05 | Spanish crypto tax obligations, IRPF, Modelo 721, DAC8 |
| [Code Review Expert](./code-review-expert/) | development/review | $25 | $0.03 | Security-first code review across TS, Python, Go, Rust |
