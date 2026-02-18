# ContextDAO - Project Plan

## Epic
A decentralized marketplace for "Cognitive Assets" — high-performance .md system prompts and context files that can be traded, rented, or optimized for yield via x402 payment protocol.

## Target User
AI agent developers, prompt engineers, and knowledge specialists who create or consume high-value system prompts.

## Problem
No marketplace exists to monetize, trade, or collaboratively optimize high-value system prompts. Prompt IP is unprotected, there's no standard payment protocol for agent-to-agent transactions, and no incentive mechanism for prompt optimization.

## Features

### Feature 1: Skill Registry & Marketplace UI
Browse, search, and view cognitive assets (.md skills) with metadata including description, price, accuracy score, and usage stats.

**User Stories:**
- As a prompt engineer, I want to list my .md skills with metadata (description, price, accuracy score), so that buyers can discover and evaluate them.
- As an AI agent developer, I want to search and filter available skills by category and performance score, so that I find the right cognitive asset for my use case.

### Feature 2: x402 Payment Gate ⭐ MVP
FastAPI runner with 402 Payment Required middleware. Every API call to a skill endpoint returns a 402 with payment details. The calling agent must attach payment proof to get access.

**User Stories:**
- As an AI agent, I want to receive a 402 Payment Required response with payment details, so that I know what to pay before accessing a skill.
- As a skill owner, I want my .md file served only after payment proof is verified, so that I monetize my cognitive assets.

### Feature 3: Blind Inference Runner
Secure "black box" container that injects hidden .md context into inference calls. Renters use the skill without seeing the source prompt — IP stays protected.

**User Stories:**
- As a skill renter, I want to send a prompt and receive an inference result without seeing the underlying system prompt, so that I can use premium skills on a per-request basis.
- As a skill owner, I want my prompt IP protected during rental inference, so that renters can't steal my work.

### Feature 4: MCP Server Interface
A Marketplace MCP Server that lets Claude (or any MCP-compatible agent) browse, purchase, and mount skills directly into their context.

**User Stories:**
- As a Claude Code user, I want to say "I need a skill to analyze Spanish crypto taxes" and have the MCP server find, purchase, and mount it automatically.
- As a skill owner, I want my skills discoverable via MCP protocol, so that agents can find them natively.

### Feature 5: Validation League
Referee agent that runs submitted prompt optimizations against a validation set. If accuracy improves or token usage decreases, x402 smart payment is triggered to the optimizer.

**User Stories:**
- As a prompt optimizer, I want to submit an improved version of a skill and get paid automatically if my version scores higher on the validation set.
- As a skill owner, I want to post bounties for prompt optimization, so that the crowd improves my cognitive assets.

## Today's Goal
Build Feature 1 (Marketplace UI) and Feature 2 (x402 Payment Gate) — the visual marketplace and the core protocol primitive.

## Tech Decisions
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS
- **Payment Protocol:** x402 (HTTP 402 Payment Required)
- **Backend Runner:** FastAPI (Python) for blind inference
- **Validation:** LLM-as-a-Judge + string matching

---
*Planned at Claude Code Masterclass Barcelona*
