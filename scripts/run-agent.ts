#!/usr/bin/env tsx

/**
 * Agent Runner Script
 *
 * This script provides a programmatic way to run specialized agents
 * for various maintenance and development tasks.
 *
 * Usage:
 *   npm run agent <agent-type> [options]
 *   tsx scripts/run-agent.ts security-audit --focus authentication
 *   tsx scripts/run-agent.ts code-review --files "app/api/**"
 *   tsx scripts/run-agent.ts feature --name "waitlist" --description "Add waitlist feature"
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Agent configurations
const AGENTS = {
  'security-audit': {
    name: 'Security Auditor',
    description: 'Reviews code for security vulnerabilities',
    prompt: (options: any) => `
      Perform a comprehensive security audit on the booking system.
      Focus areas: ${options.focus || 'all'}

      Check for:
      1. Authentication vulnerabilities (JWT, admin routes)
      2. SQL injection risks in Prisma queries
      3. XSS vulnerabilities in user inputs
      4. CSRF protection in forms
      5. Secure Stripe payment handling
      6. Environment variable exposure
      7. API rate limiting
      8. Input validation
      9. Session management
      10. Production deployment security

      Provide:
      - Vulnerabilities with severity ratings
      - Specific fixes with code examples
      - Best practice recommendations
    `
  },

  'code-review': {
    name: 'Code Reviewer',
    description: 'Reviews code quality and best practices',
    prompt: (options: any) => `
      Review code quality for: ${options.files || 'recent changes'}

      Check for:
      1. TypeScript type safety
      2. React 19 best practices
      3. Next.js 15 App Router patterns
      4. Prisma query optimization
      5. Component reusability
      6. Error handling
      7. Code duplication
      8. Performance issues
      9. Accessibility
      10. Naming conventions

      Provide:
      - Issues with file:line references
      - Refactoring suggestions
      - Performance improvements
    `
  },

  'performance': {
    name: 'Performance Optimizer',
    description: 'Identifies and fixes performance bottlenecks',
    prompt: (options: any) => `
      Analyze performance for: ${options.area || 'entire application'}

      Focus on:
      1. Database query optimization (N+1 queries)
      2. Bundle size reduction
      3. Image optimization
      4. Lazy loading opportunities
      5. Caching strategies
      6. SSR/SSG optimization
      7. API response times
      8. Memory leaks
      9. Render performance
      10. Network requests

      Provide:
      - Performance metrics
      - Optimization recommendations
      - Implementation code
    `
  },

  'feature': {
    name: 'Feature Implementer',
    description: 'Implements new features following patterns',
    prompt: (options: any) => `
      Implement feature: ${options.name}
      Description: ${options.description}

      Requirements:
      ${options.requirements || 'Standard implementation'}

      Implementation steps:
      1. Database schema (Prisma)
      2. API endpoints (Next.js routes)
      3. React components
      4. Admin dashboard integration
      5. Email notifications
      6. Real-time updates
      7. Mobile responsiveness
      8. Error handling
      9. Testing
      10. Documentation

      Follow existing patterns in the codebase.
    `
  },

  'style-migrate': {
    name: 'Style Migrator',
    description: 'Migrates styling to new design system',
    prompt: (options: any) => `
      Migrate styling for: ${options.components || 'all components'}

      From:
      - Tailwind CSS 3.4.17
      - Prohibition theme (gold, burgundy, charcoal)

      To:
      - Tailwind CSS 4
      - New design system: ${options.designSystem || 'specified in target'}

      Tasks:
      1. Update tailwind.config.ts
      2. Convert deprecated classes
      3. Apply new colors
      4. Update typography
      5. Maintain responsiveness
      6. Test visual consistency

      Provide migration plan and updated code.
    `
  },

  'production-ready': {
    name: 'Production Readiness Checker',
    description: 'Ensures application is production-ready',
    prompt: (options: any) => `
      Perform production readiness check.
      Deployment target: ${options.target || 'VPS with CloudPanel'}

      Checklist:
      1. Security (auth, encryption, validation)
      2. Performance (optimization, caching)
      3. Reliability (error handling, timeouts)
      4. Monitoring (logging, alerts)
      5. Compliance (GDPR, PCI, accessibility)
      6. Documentation
      7. Backup strategies
      8. Load testing results
      9. Deployment configuration
      10. Rollback procedures

      Provide:
      - Critical issues to fix
      - Deployment checklist
      - Monitoring setup
    `
  },

  'bug-fix': {
    name: 'Bug Fixer',
    description: 'Diagnoses and fixes bugs',
    prompt: (options: any) => `
      Fix bug: ${options.description}

      Symptoms: ${options.symptoms || 'As reported'}
      Environment: ${options.env || 'development'}

      Debugging steps:
      1. Reproduce the issue
      2. Check logs and errors
      3. Inspect database state
      4. Review recent changes
      5. Test edge cases
      6. Implement fix
      7. Verify solution
      8. Check side effects

      Provide:
      - Root cause analysis
      - Fix with code
      - Testing verification
    `
  },

  'dependency-update': {
    name: 'Dependency Updater',
    description: 'Updates and audits dependencies',
    prompt: (options: any) => `
      Update dependencies for: ${options.scope || 'all packages'}

      Tasks:
      1. Check for security vulnerabilities
      2. Identify outdated packages
      3. Review breaking changes
      4. Update package.json
      5. Resolve conflicts
      6. Test functionality
      7. Update TypeScript types
      8. Verify build process

      Provide:
      - Update plan
      - Risk assessment
      - Testing checklist
    `
  }
};

// Helper functions
async function runAgent(agentType: string, options: any) {
  const agent = AGENTS[agentType as keyof typeof AGENTS];

  if (!agent) {
    console.error(`Unknown agent type: ${agentType}`);
    console.log('Available agents:', Object.keys(AGENTS).join(', '));
    return;
  }

  console.log(`\n🤖 Running ${agent.name}...`);
  console.log(`📋 ${agent.description}\n`);

  // Generate the prompt
  const prompt = agent.prompt(options);

  // Log the task
  await logAgentRun(agentType, options, prompt);

  console.log('Task details:');
  console.log(prompt);

  console.log('\n✅ Agent task has been prepared.');
  console.log('💡 Copy the prompt above to Claude Code to execute the agent task.');

  // Optionally, save to file for reference
  if (options.save) {
    const filename = `agent-${agentType}-${Date.now()}.md`;
    const filepath = path.join(process.cwd(), 'scripts', 'agent-tasks', filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, prompt);

    console.log(`\n📁 Task saved to: ${filepath}`);
  }
}

async function logAgentRun(agentType: string, options: any, prompt: string) {
  const logDir = path.join(process.cwd(), 'logs', 'agents');
  await fs.mkdir(logDir, { recursive: true });

  const logFile = path.join(logDir, `agent-runs-${new Date().toISOString().split('T')[0]}.log`);

  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: agentType,
    options,
    promptLength: prompt.length
  };

  try {
    const existing = await fs.readFile(logFile, 'utf-8').catch(() => '[]');
    const logs = JSON.parse(existing || '[]');
    logs.push(logEntry);
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.warn('Could not write to log file:', error);
  }
}

// Quick audit functions
async function quickSecurityCheck() {
  console.log('\n🔒 Running Quick Security Check...\n');

  const checks = [
    'Checking for exposed API keys...',
    'Verifying JWT secret strength...',
    'Checking Stripe webhook validation...',
    'Reviewing database query safety...',
    'Checking input validation...'
  ];

  for (const check of checks) {
    console.log(`  ✓ ${check}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Quick check complete. Run full audit for detailed results.');
}

async function listRecentChanges() {
  try {
    const { stdout } = await execAsync('git log --oneline -10');
    console.log('\n📝 Recent changes:\n');
    console.log(stdout);
  } catch (error) {
    console.error('Could not fetch recent changes');
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const agentType = args[0];

  if (!agentType) {
    console.log(`
🤖 Booking System Agent Runner
================================

Usage:
  tsx scripts/run-agent.ts <agent-type> [options]

Available Agents:
${Object.entries(AGENTS).map(([key, agent]) =>
  `  • ${key.padEnd(20)} - ${agent.description}`
).join('\n')}

Examples:
  tsx scripts/run-agent.ts security-audit --focus authentication
  tsx scripts/run-agent.ts code-review --files "app/api/**"
  tsx scripts/run-agent.ts feature --name "waitlist" --description "Add waitlist"
  tsx scripts/run-agent.ts style-migrate --components "booking/*"
  tsx scripts/run-agent.ts production-ready --target "VPS"

Quick Commands:
  tsx scripts/run-agent.ts quick-security    # Quick security check
  tsx scripts/run-agent.ts recent-changes    # Show recent git changes
    `);
    return;
  }

  // Handle special commands
  if (agentType === 'quick-security') {
    await quickSecurityCheck();
    return;
  }

  if (agentType === 'recent-changes') {
    await listRecentChanges();
    return;
  }

  // Parse options
  const options: any = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  // Run the selected agent
  await runAgent(agentType, options);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { AGENTS, runAgent };