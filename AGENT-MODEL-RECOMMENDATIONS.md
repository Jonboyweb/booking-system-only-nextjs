# Agent Model Recommendations for Claude Code

## Model Selection Guide

Claude Code offers different models optimized for different tasks. Here's the recommended model for each agent:

## Agent-to-Model Mapping

### 🔒 Security Auditor Agent
**Recommended Model: Opus**
- **Why:** Security analysis requires deep reasoning, pattern recognition across files, and understanding of complex attack vectors
- **Alternative:** Sonnet 3.5 (if Opus unavailable)
- **Setup:** Copy the full YAML block and prompt template from AGENTS.md

### 📝 Code Reviewer Agent
**Recommended Model: Sonnet 3.5**
- **Why:** Excellent at code analysis, pattern detection, and providing actionable feedback
- **Alternative:** Opus (for very complex architectural reviews)
- **Setup:** Use the YAML and prompt, focus on specific file patterns

### ⚡ Performance Optimizer Agent
**Recommended Model: Sonnet 3.5**
- **Why:** Good balance of speed and capability for analyzing performance patterns
- **Alternative:** Haiku (for quick performance checks)
- **Setup:** Include specific metrics and areas to focus on

### 🎨 Style Migrator Agent
**Recommended Model: Sonnet 3.5**
- **Why:** Excellent at pattern matching and systematic transformations
- **Alternative:** Haiku (for simple class replacements)
- **Setup:** Provide clear before/after examples

### 🔀 Project Merger Agent
**Recommended Model: Opus**
- **Why:** Complex task requiring understanding of two codebases and architectural decisions
- **Alternative:** Sonnet 3.5 (for smaller merges)
- **Setup:** Provide both repository structures

### ✨ Feature Implementer Agent
**Recommended Model: Opus**
- **Why:** Needs to understand existing patterns and create consistent new code
- **Alternative:** Sonnet 3.5 (for simpler features)
- **Setup:** Include detailed requirements and examples

### 🐛 Bug Fixer Agent
**Recommended Model: Sonnet 3.5**
- **Why:** Good at debugging and reasoning about code behavior
- **Alternative:** Opus (for complex, multi-file bugs)
- **Setup:** Provide detailed reproduction steps

### 🚀 Production Readiness Agent
**Recommended Model: Opus**
- **Why:** Comprehensive analysis across security, performance, and reliability
- **Alternative:** Sonnet 3.5 (for focused checks)
- **Setup:** Use full checklist from AGENTS.md

### 📦 Dependency Updater Agent
**Recommended Model: Haiku**
- **Why:** Straightforward task that doesn't require deep reasoning
- **Alternative:** Sonnet 3.5 (for major version migrations)
- **Setup:** Specify scope and risk tolerance

### 📚 Documentation Writer Agent
**Recommended Model: Sonnet 3.5**
- **Why:** Excellent at technical writing and explanation
- **Alternative:** Haiku (for simple updates)
- **Setup:** Provide documentation style guide

## Setting Up Agents in Claude Code

### Step 1: Create New Agent

When creating a new agent in Claude Code:

1. **Name**: Use the exact name from AGENTS.md (e.g., `security-auditor`)
2. **Model**: Select based on recommendations above
3. **Description**: Copy the YAML block from AGENTS.md

### Step 2: Configure the Agent

For the Security Auditor example you highlighted:

```yaml
# Copy this entire block into the agent description
name: security-auditor
type: general-purpose
description: Reviews code for security vulnerabilities and production readiness
capabilities:
  - Analyze authentication and authorization
  - Check for SQL injection vulnerabilities
  - Review API endpoint security
  - Validate input sanitization
  - Check environment variable handling
  - Review Stripe payment security
  - Audit JWT implementation

Initial Prompt:
You are a security specialist for a Next.js booking system. Review the codebase for:
1. Authentication vulnerabilities in the JWT implementation
2. SQL injection risks in Prisma queries
3. XSS vulnerabilities in user inputs
4. CSRF protection in forms
5. Secure handling of Stripe payments
6. Environment variable exposure
7. Rate limiting on API endpoints
8. Input validation and sanitization
9. Secure session management
10. Production deployment security

Working Directory: /home/cdev/booking-system-only-nextjs
Key Files to Review:
- /app/api/admin/auth/* (Authentication)
- /app/api/payment/* (Payment processing)
- /middleware.ts (Route protection)
- /lib/db.ts (Database access)
- /.env* (Environment variables)
```

### Step 3: Agent Invocation

When invoking the agent, be specific:

```
# Good invocation
"Review the authentication system for security vulnerabilities, focusing on JWT implementation and admin route protection"

# Better invocation
"Perform a security audit on:
1. JWT token generation and validation in /app/api/admin/auth
2. Admin route protection in /middleware.ts
3. Payment webhook validation in /app/api/payment/webhook
Provide severity ratings and specific fixes"
```

## Model Selection Decision Tree

```
Is the task complex and requires deep reasoning?
├─ YES → Use Opus
│   ├─ Security analysis
│   ├─ Architecture decisions
│   ├─ Complex feature implementation
│   └─ Multi-project merging
│
└─ NO → Is it code analysis or transformation?
    ├─ YES → Use Sonnet 3.5
    │   ├─ Code review
    │   ├─ Bug fixing
    │   ├─ Style migration
    │   └─ Documentation
    │
    └─ NO → Use Haiku
        ├─ Simple updates
        ├─ Dependency checks
        └─ Quick validations
```

## Agent Combinations for Different Models

### High-Complexity Flow (Opus-heavy)
```
1. security-auditor (Opus) → Deep security analysis
2. feature-implementer (Opus) → Complex feature addition
3. project-merger (Opus) → Codebase integration
```

### Balanced Flow (Mix of models)
```
1. code-reviewer (Sonnet 3.5) → Initial review
2. bug-fixer (Sonnet 3.5) → Fix issues
3. security-auditor (Opus) → Final security check
4. documentation-writer (Sonnet 3.5) → Update docs
```

### Quick Check Flow (Speed-optimized)
```
1. dependency-updater (Haiku) → Check updates
2. code-reviewer (Sonnet 3.5) → Quick review
3. documentation-writer (Haiku) → Minor updates
```

## Best Practices for Agent Configuration

### 1. Include Context in Agent Description

Add project-specific context to the agent:

```yaml
name: security-auditor
context:
  - Next.js 15 App Router project
  - PostgreSQL with Prisma ORM
  - Stripe payment integration
  - JWT authentication
  - Production URL: https://br.door50a.co.uk
```

### 2. Specify Working Files

Tell the agent where to focus:

```yaml
focus_areas:
  - /app/api/** (API endpoints)
  - /middleware.ts (Auth middleware)
  - /lib/** (Core utilities)
  - /prisma/schema.prisma (Database)
```

### 3. Set Clear Boundaries

Define what NOT to change:

```yaml
constraints:
  - Don't modify database schema without migration
  - Preserve existing API contracts
  - Maintain backward compatibility
  - Keep existing environment variables
```

### 4. Provide Success Criteria

Define what success looks like:

```yaml
success_criteria:
  - No critical security vulnerabilities
  - All inputs validated
  - Authentication properly implemented
  - Payment flow secure
  - Ready for production deployment
```

## Quick Reference Table

| Agent | Primary Model | Alt Model | Use When |
|-------|--------------|-----------|----------|
| security-auditor | Opus | Sonnet 3.5 | Pre-deployment, after major changes |
| code-reviewer | Sonnet 3.5 | Opus | Daily reviews, PR checks |
| performance-optimizer | Sonnet 3.5 | Haiku | Performance issues, before launch |
| style-migrator | Sonnet 3.5 | Haiku | UI updates, design changes |
| project-merger | Opus | Sonnet 3.5 | Combining codebases |
| feature-implementer | Opus | Sonnet 3.5 | New functionality |
| bug-fixer | Sonnet 3.5 | Opus | Issue resolution |
| production-readiness | Opus | Sonnet 3.5 | Before deployment |
| dependency-updater | Haiku | Sonnet 3.5 | Regular maintenance |
| documentation-writer | Sonnet 3.5 | Haiku | After changes |

## Testing Your Agents

After creating an agent, test it with a simple task:

```bash
# Test security-auditor
"Check if environment variables are properly secured in the codebase"

# Test code-reviewer
"Review the booking API endpoint for best practices"

# Test bug-fixer
"Check for any potential null reference errors in the booking flow"
```

## Tips for Optimal Performance

1. **Use Opus for critical paths** - Security, payments, authentication
2. **Use Sonnet 3.5 for most development** - Good balance of speed and quality
3. **Use Haiku for routine tasks** - Simple updates, checks
4. **Batch similar tasks** - Run multiple files through the same agent
5. **Be specific in prompts** - Include file paths and specific requirements

Remember: You can always start with a faster model and escalate to Opus if the task requires more sophisticated reasoning.