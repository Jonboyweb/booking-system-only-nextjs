# Agent Usage Guide for Booking System

This guide shows you how to use specialized agents to maintain, improve, and evolve your booking system.

## Quick Start

### Using Agents with Claude Code

Simply describe what you want to the agent in natural language:

```
"Run a security audit focusing on payment processing and user authentication"
```

Claude will use the appropriate specialized agent to complete the task.

### Using the Agent Runner Script

```bash
# Run specific agents programmatically
tsx scripts/run-agent.ts security-audit --focus payments
tsx scripts/run-agent.ts code-review --files "app/api/**"
tsx scripts/run-agent.ts production-ready --target VPS
```

## Common Tasks and Their Agents

### 1. Security Review Before Production

**Task:** Ensure the application is secure for production launch

```bash
# Step 1: Run comprehensive security audit
"Use the security-auditor agent to perform a full security review of the booking system, focusing on:
- JWT authentication in admin routes
- Stripe payment security
- Input validation and sanitization
- SQL injection prevention
- Environment variable handling"

# Step 2: Fix critical issues
"Use the bug-fixer agent to address the critical security issues found in the audit"

# Step 3: Verify fixes
"Re-run security-auditor on the fixed areas to verify all issues are resolved"
```

### 2. Migrating to New Design System

**Task:** Update the entire UI to match a new website's design

```bash
# Step 1: Analyze current styling
"Use the code-reviewer agent to document all components using the prohibition theme colors and fonts"

# Step 2: Create migration plan
"Use the style-migrator agent to create a migration plan from:
- Current: Tailwind 3 with gold/burgundy/charcoal theme
- Target: Tailwind 4 with [specify new color scheme]
Include a mapping of old classes to new ones"

# Step 3: Migrate components progressively
"Use the style-migrator agent to update the booking form components to the new design system"

# Step 4: Verify consistency
"Use the code-reviewer agent to ensure all migrated components follow the new design system consistently"
```

### 3. Merging with Another Website

**Task:** Integrate the booking system into an existing website

```bash
# Step 1: Analyze both projects
"Use the project-merger agent to analyze:
- Source: This booking system structure
- Target: [Main website repository URL]
Provide a detailed merge strategy"

# Step 2: Prepare database integration
"Use the database-migrator agent to merge the booking system schema with the main website database"

# Step 3: Merge codebases
"Use the project-merger agent to:
1. Move booking routes under /booking prefix
2. Integrate authentication systems
3. Merge configuration files
4. Resolve dependency conflicts"

# Step 4: Test integration
"Use the bug-fixer agent to identify and fix any integration issues"
```

### 4. Adding New Features

**Task:** Implement a table waitlist feature

```bash
# Step 1: Design the feature
"Use the feature-implementer agent to design a waitlist feature where:
- Customers can join a waitlist for booked tables
- They get notified when a table becomes available
- Admin can manage the waitlist
- Automatic expiry after 24 hours"

# Step 2: Implement database changes
"Use the feature-implementer agent to:
1. Create Waitlist model in Prisma schema
2. Add necessary relations to Booking and Customer
3. Create and run migration"

# Step 3: Build API endpoints
"Use the feature-implementer agent to create API endpoints:
- POST /api/waitlist - Join waitlist
- GET /api/waitlist/position - Check position
- DELETE /api/waitlist/[id] - Leave waitlist
- Admin endpoints for management"

# Step 4: Create UI components
"Use the feature-implementer agent to build:
- Waitlist join button on fully booked tables
- Waitlist position display
- Email notification templates
- Admin dashboard waitlist section"
```

### 5. Performance Optimization

**Task:** Improve application performance

```bash
# Step 1: Identify bottlenecks
"Use the performance-optimizer agent to analyze:
- Database query performance
- Bundle sizes
- API response times
- Rendering performance"

# Step 2: Optimize database
"Use the performance-optimizer agent to:
- Add missing database indexes
- Optimize N+1 queries
- Implement query result caching"

# Step 3: Optimize frontend
"Use the performance-optimizer agent to:
- Implement code splitting
- Add lazy loading for images
- Optimize bundle size
- Add service worker caching"
```

### 6. Production Deployment Preparation

**Task:** Prepare for production launch

```bash
# Step 1: Production readiness check
"Use the production-readiness agent to perform a comprehensive check covering:
- Security vulnerabilities
- Performance optimizations
- Error handling
- Monitoring setup
- Backup strategies"

# Step 2: Setup monitoring
"Use the deployment-assistant agent to:
- Configure error tracking (Sentry)
- Setup uptime monitoring
- Configure log aggregation
- Create alert rules"

# Step 3: Create deployment checklist
"Use the deployment-assistant agent to create a deployment checklist including:
- Environment variable verification
- Database backup procedures
- SSL certificate setup
- CDN configuration
- Rollback procedures"
```

## Agent Combinations for Complex Tasks

### Complete Security Hardening

```bash
1. security-auditor → Identify vulnerabilities
2. bug-fixer → Fix critical issues
3. code-reviewer → Review fixes
4. production-readiness → Final verification
```

### Full UI Modernization

```bash
1. code-reviewer → Document current UI
2. style-migrator → Create migration plan
3. feature-implementer → Update components
4. bug-fixer → Fix styling issues
5. code-reviewer → Ensure consistency
```

### Feature Development Cycle

```bash
1. feature-implementer → Build feature
2. code-reviewer → Review implementation
3. security-auditor → Check security
4. performance-optimizer → Optimize
5. bug-fixer → Fix issues
6. documentation-writer → Update docs
```

## Best Practices

### 1. Always Start with Analysis

Before making changes, use review agents to understand the current state:

```bash
"Use code-reviewer to analyze the booking flow implementation before adding new features"
```

### 2. Security First

Run security audits regularly and especially before deployments:

```bash
"Use security-auditor to check all API endpoints after implementing the new feature"
```

### 3. Incremental Changes

Break large tasks into smaller, testable chunks:

```bash
# Instead of: "Migrate entire UI"
# Do: "Migrate header component", then "Migrate booking form", etc.
```

### 4. Verify Each Step

After each major change, verify it works correctly:

```bash
"Use bug-fixer to verify the waitlist feature works correctly with all edge cases"
```

### 5. Document Changes

Keep documentation updated:

```bash
"Use documentation-writer to update CLAUDE.md with the new waitlist feature details"
```

## Scheduling Regular Maintenance

### Daily Tasks

```bash
# Morning security check
tsx scripts/run-agent.ts quick-security

# Review recent changes
tsx scripts/run-agent.ts code-review --files "$(git diff --name-only HEAD~1)"
```

### Weekly Tasks

```bash
# Dependency security check
tsx scripts/run-agent.ts dependency-update --scope security

# Performance review
tsx scripts/run-agent.ts performance --area database
```

### Before Each Deployment

```bash
# Full production readiness check
tsx scripts/run-agent.ts production-ready --target production

# Security audit
tsx scripts/run-agent.ts security-audit --focus all

# Generate deployment checklist
tsx scripts/run-agent.ts deployment-assistant --create-checklist
```

## Troubleshooting Common Issues

### Agent Not Understanding Context

Be more specific:
```bash
# Instead of: "Fix the bug"
# Use: "Use bug-fixer to fix the booking form validation error that occurs when selecting combined tables 15 and 16"
```

### Agent Making Too Many Changes

Limit the scope:
```bash
# Add boundaries
"Use code-reviewer to review ONLY the payment processing files in app/api/payment/*"
```

### Agent Missing Requirements

Provide complete context:
```bash
"Use feature-implementer to add waitlist feature. Requirements:
- Maximum 10 people per waitlist
- 24-hour expiry
- Email notifications
- Follow existing booking patterns in /app/booking"
```

## Advanced Agent Usage

### Creating Custom Agents

For specialized needs, create custom agents:

```javascript
// In scripts/run-agent.ts, add:
'custom-validator': {
  name: 'Custom Business Logic Validator',
  description: 'Validates business rules specific to Backroom Leeds',
  prompt: (options) => `
    Validate that the booking system enforces:
    - 31-day advance booking limit
    - 2-hour time slots
    - £50 deposit requirement
    - Table combination rules (15 & 16)
    - VIP table restrictions
    [... custom rules ...]
  `
}
```

### Chaining Agents Programmatically

Create scripts that chain multiple agents:

```typescript
// scripts/full-audit.ts
import { runAgent } from './run-agent';

async function fullAudit() {
  await runAgent('security-audit', { focus: 'all' });
  await runAgent('code-review', { files: 'app/**' });
  await runAgent('performance', { area: 'all' });
  await runAgent('production-ready', { target: 'VPS' });

  console.log('Full audit complete!');
}

fullAudit();
```

## Getting Help

If you need help with agents:

1. Check the agent definition in AGENTS.md
2. Review examples in this guide
3. Start with simpler, more specific requests
4. Break complex tasks into steps
5. Provide clear context and requirements

Remember: Agents work best when given clear, specific instructions with proper context about what you want to achieve.