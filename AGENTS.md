# Specialized Agents for Booking System Project

This document defines specialized agents for maintaining, improving, and evolving the Backroom Leeds booking system.

## Table of Contents
- [Core Agent Types](#core-agent-types)
- [Agent Definitions](#agent-definitions)
- [Usage Examples](#usage-examples)
- [Agent Prompts](#agent-prompts)

## Core Agent Types

### 1. Code Quality Agents
- **security-auditor**: Reviews code for security vulnerabilities
- **code-reviewer**: Analyzes code quality and best practices
- **performance-optimizer**: Identifies and fixes performance bottlenecks
- **production-readiness**: Comprehensive pre-deployment checks

### 2. Development Agents
- **feature-implementer**: Adds new features following existing patterns
- **bug-fixer**: Diagnoses and repairs issues
- **documentation-writer**: Creates and maintains technical documentation

### 3. Migration Agents
- **style-migrator**: Converts styling from Tailwind 3 to Tailwind 4
- **project-merger**: Merges this project with another codebase

### 4. Maintenance Agents
- **dependency-updater**: Updates packages and resolves conflicts

## Agent Definitions

### Security Auditor Agent

```yaml
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
```

**Prompt Template:**
```
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

Focus on: [SPECIFIC_AREA]

Provide:
- List of vulnerabilities found
- Severity rating (Critical/High/Medium/Low)
- Specific code fixes
- Best practice recommendations
```

### Code Reviewer Agent

```yaml
name: code-reviewer
type: general-purpose
description: Reviews code quality, patterns, and Next.js best practices
capabilities:
  - Check TypeScript type safety
  - Review React component patterns
  - Validate Next.js App Router usage
  - Check error handling
  - Review database query optimization
  - Validate API response patterns
```

**Prompt Template:**
```
Review this Next.js 15 booking system for code quality:

1. TypeScript type safety and proper typing
2. React 19 best practices and hooks usage
3. Next.js App Router patterns
4. Prisma query optimization
5. Component reusability and organization
6. Error handling and logging
7. Code duplication
8. Performance optimizations
9. Accessibility standards
10. Consistent naming conventions

Review focus: [FILE_OR_FEATURE]

Provide:
- Issues found with line references
- Refactoring suggestions
- Performance improvements
- Best practice violations
```

### Style Migrator Agent

```yaml
name: style-migrator
type: general-purpose
description: Migrates styling from current theme to new Tailwind 4 design
capabilities:
  - Convert Tailwind 3 classes to Tailwind 4
  - Apply new design system colors and fonts
  - Update component styling patterns
  - Maintain responsive design
  - Preserve prohibition theme elements
```

**Prompt Template:**
```
Migrate the booking system styling to match the target website design:

Current Setup:
- Tailwind CSS 3.4.17
- Prohibition theme (gold, burgundy, charcoal)
- Fonts: Bebas Neue, Poiret One, Playfair Display

Target Setup:
- Tailwind CSS 4.x
- New color palette: [SPECIFY_COLORS]
- New typography: [SPECIFY_FONTS]
- Design system: [SPECIFY_SYSTEM]

Tasks:
1. Update tailwind.config.ts for Tailwind 4
2. Convert deprecated class names
3. Apply new color variables
4. Update component styling
5. Maintain responsive breakpoints
6. Update font families
7. Preserve functionality while changing appearance

Files to migrate: [SPECIFY_COMPONENTS]
```

### Project Merger Agent

```yaml
name: project-merger
type: general-purpose
description: Merges booking system with another Next.js project
capabilities:
  - Analyze project structures
  - Resolve dependency conflicts
  - Merge routing systems
  - Integrate authentication systems
  - Combine database schemas
  - Merge configuration files
```

**Prompt Template:**
```
Merge the Backroom booking system with another Next.js project:

Source Project (Booking System):
- Next.js 15 with App Router
- PostgreSQL with Prisma
- Stripe payments
- JWT authentication
- SendGrid/MailHog emails

Target Project:
- Structure: [DESCRIBE_STRUCTURE]
- Database: [DESCRIBE_DATABASE]
- Auth: [DESCRIBE_AUTH]
- Styling: [DESCRIBE_STYLING]

Merge Strategy:
1. Analyze both project structures
2. Plan unified routing structure
3. Merge database schemas
4. Combine authentication systems
5. Integrate API endpoints
6. Resolve dependency conflicts
7. Merge configuration files
8. Create migration plan

Deliverables:
- Merged project structure
- Database migration scripts
- Dependency resolution
- Configuration updates
- Testing checklist
```

### Feature Implementer Agent

```yaml
name: feature-implementer
type: general-purpose
description: Implements new features following existing patterns
capabilities:
  - Follow existing code patterns
  - Create database migrations
  - Implement API endpoints
  - Build React components
  - Add admin dashboard features
  - Integrate third-party services
```

**Prompt Template:**
```
Implement a new feature for the booking system:

Feature: [FEATURE_NAME]
Description: [DETAILED_DESCRIPTION]

Requirements:
- User stories: [LIST_USER_STORIES]
- Technical requirements: [LIST_REQUIREMENTS]
- UI/UX specifications: [DESCRIBE_UI]

Implementation checklist:
1. Database schema changes (Prisma)
2. API endpoints (Next.js API routes)
3. Frontend components (React/TypeScript)
4. Admin dashboard integration
5. Email notifications if needed
6. Payment integration if needed
7. Real-time updates (SSE) if needed
8. Mobile responsiveness
9. Error handling
10. Testing

Follow existing patterns in:
- API responses: {success, data/error}
- Database access: using singleton
- Component structure: /components folder
- Admin protection: JWT middleware
```

### Bug Fixer Agent

```yaml
name: bug-fixer
type: general-purpose
description: Diagnoses and fixes bugs systematically
capabilities:
  - Reproduce issues
  - Debug Next.js applications
  - Fix database issues
  - Resolve payment problems
  - Fix email delivery issues
  - Handle edge cases
```

**Prompt Template:**
```
Fix a bug in the booking system:

Bug Report:
- Description: [BUG_DESCRIPTION]
- Steps to reproduce: [STEPS]
- Expected behavior: [EXPECTED]
- Actual behavior: [ACTUAL]
- Environment: [LOCAL/PRODUCTION]

Debugging approach:
1. Reproduce the issue
2. Check relevant logs
3. Inspect database state
4. Review recent changes
5. Check API responses
6. Verify environment variables
7. Test edge cases
8. Implement fix
9. Verify fix works
10. Check for side effects

Provide:
- Root cause analysis
- Code fix with file paths
- Testing verification
- Prevention recommendations
```

### Production Readiness Agent

```yaml
name: production-readiness
type: general-purpose
description: Ensures the application is production-ready
capabilities:
  - Security audit
  - Performance optimization
  - Error handling review
  - Monitoring setup
  - Backup strategies
  - Load testing
```

**Prompt Template:**
```
Prepare the booking system for production launch:

Production Checklist:
1. Security
   - Environment variables secured
   - API rate limiting implemented
   - Input validation complete
   - XSS/CSRF protection
   - SQL injection prevention

2. Performance
   - Database indexes optimized
   - Image optimization
   - Bundle size minimized
   - Caching implemented
   - SSR/SSG optimization

3. Reliability
   - Error boundaries added
   - Graceful error handling
   - Timeout handling
   - Retry mechanisms
   - Database connection pooling

4. Monitoring
   - Logging strategy
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring
   - Alert configuration

5. Compliance
   - GDPR compliance
   - Payment PCI compliance
   - Accessibility (WCAG)
   - Cookie policy
   - Terms of service

Review and provide:
- Critical issues to fix
- Recommended improvements
- Deployment checklist
- Monitoring setup guide
```

### Dependency Updater Agent

```yaml
name: dependency-updater
type: general-purpose
description: Updates packages and resolves dependency conflicts
capabilities:
  - Security vulnerability scanning
  - Package version updates
  - Breaking change analysis
  - Dependency conflict resolution
  - Lock file management
  - License compliance checking
```

**Prompt Template:**
```
Update and audit dependencies for the booking system:

Current Setup:
- Next.js 15.5.2
- React 19
- Prisma 6.16.2
- Stripe 18.5.0
- Tailwind CSS 3.4.17
- TypeScript 5.9.2

Tasks:
1. Security Audit
   - Check for known vulnerabilities (npm audit)
   - Review security advisories
   - Identify critical updates
   - Check for exposed dependencies

2. Version Updates
   - Identify outdated packages
   - Review breaking changes
   - Plan update strategy
   - Test compatibility

3. Dependency Analysis
   - Remove unused dependencies
   - Check for duplicate packages
   - Optimize bundle size
   - Verify peer dependencies

4. Update Process
   - Update package.json
   - Regenerate lock file
   - Run tests after updates
   - Verify build process

5. Documentation
   - Document breaking changes
   - Update README if needed
   - Note any API changes
   - Update TypeScript types

Scope: [ALL/SECURITY/MINOR/MAJOR]

Provide:
- Vulnerability report with severity
- Update recommendations with risk assessment
- Step-by-step update plan
- Testing checklist
- Rollback procedures if needed
```

### Documentation Writer Agent

```yaml
name: documentation-writer
type: general-purpose
description: Creates and maintains technical documentation
capabilities:
  - API documentation generation
  - README file updates
  - Code comment addition
  - Architecture documentation
  - Setup guides creation
  - Troubleshooting guides
```

**Prompt Template:**
```
Create/update documentation for the booking system:

Documentation Type: [API/README/SETUP/ARCHITECTURE/TROUBLESHOOTING]

Current Documentation State:
- README.md exists with project overview
- CLAUDE.md contains development guidance
- AGENTS.md defines agent system
- Basic code comments present

Tasks:
1. Code Documentation
   - Add JSDoc comments to functions
   - Document complex algorithms
   - Explain business logic
   - Add type definitions

2. API Documentation
   - Document all endpoints
   - Include request/response examples
   - List required parameters
   - Note authentication requirements
   - Add error response codes

3. Setup Documentation
   - Environment setup steps
   - Database configuration
   - Stripe integration guide
   - Email service setup
   - Production deployment

4. Architecture Documentation
   - System design overview
   - Database schema explanation
   - Authentication flow
   - Payment processing flow
   - Component hierarchy

5. User Guides
   - Admin dashboard usage
   - Booking flow explanation
   - Troubleshooting common issues
   - FAQ section

Focus Area: [SPECIFY_AREA]

Provide:
- Updated documentation files
- Inline code comments where needed
- README sections if applicable
- Migration guides for changes
- Quick reference guides
```

## Usage Examples

### Running Security Audit

```bash
# Use with Claude Code
"Run a security audit on the booking system, focusing on the payment flow and admin authentication"

# The agent will:
1. Review /app/api/payment/* endpoints
2. Check Stripe webhook validation
3. Audit JWT implementation in /app/api/admin/auth
4. Review middleware.ts for route protection
5. Check for exposed secrets
6. Validate input sanitization
```

### Implementing New Feature

```bash
# Use with Claude Code
"Implement a table reservation waitlist feature that allows customers to join a waitlist when their desired table is booked"

# The agent will:
1. Create waitlist database model
2. Add API endpoints for waitlist operations
3. Build UI components for joining waitlist
4. Add admin dashboard waitlist management
5. Implement email notifications
6. Add real-time updates
```

### Migrating Styles

```bash
# Use with Claude Code
"Migrate the booking form components to use the new design system with Tailwind 4, maintaining all functionality"

# The agent will:
1. Analyze current component styles
2. Map old classes to new system
3. Update color variables
4. Convert deprecated utilities
5. Test responsive behavior
6. Verify visual consistency
```

### Merging Projects

```bash
# Use with Claude Code
"Merge this booking system with the main website project at [repository], integrating the booking as a section"

# The agent will:
1. Analyze both project structures
2. Plan integration strategy
3. Merge routing systems
4. Combine databases
5. Resolve conflicts
6. Create unified build
```

## Agent Prompt Best Practices

### 1. Be Specific
Always provide:
- Exact file paths when relevant
- Specific areas to focus on
- Clear acceptance criteria
- Environment context (local vs production)

### 2. Provide Context
Include:
- Recent changes that might affect the task
- Related issues or tickets
- Business requirements
- User impact considerations

### 3. Set Boundaries
Specify:
- What should NOT be changed
- Backwards compatibility requirements
- Performance constraints
- Security requirements

### 4. Request Deliverables
Ask for:
- Code changes with file paths
- Migration scripts if needed
- Testing instructions
- Documentation updates
- Deployment notes

## Continuous Improvement Workflow

### Daily Tasks
```bash
# Morning security check
"Run security-auditor on recent commits"

# Code quality review
"Run code-reviewer on changed files"

# Dependency check
"Check for security updates in dependencies"
```

### Weekly Tasks
```bash
# Performance review
"Run performance-optimizer on database queries and API endpoints"

# Documentation update
"Update technical documentation for recent changes"

# Test coverage
"Review and improve test coverage for critical paths"
```

### Pre-Deployment Tasks
```bash
# Full security audit
"Run comprehensive security audit for production"

# Performance testing
"Test application performance under load"

# Deployment preparation
"Prepare deployment checklist and verify all systems"
```

## Integration with CI/CD

These agents can be integrated into your development workflow:

1. **Pre-commit**: Run code-reviewer on staged files
2. **Pull Request**: Run security-auditor and code-reviewer
3. **Pre-deployment**: Run production-readiness check
4. **Post-deployment**: Run monitoring setup verification

## Custom Agent Creation

To create a new specialized agent:

1. Define the agent's specific purpose
2. List required capabilities
3. Create a detailed prompt template
4. Include example usage
5. Add to this documentation

Example template:
```yaml
name: your-agent-name
type: general-purpose
description: What this agent does
capabilities:
  - List of specific skills
prompt: |
  Detailed instructions for the agent
  Including context and requirements
usage: |
  Example of how to invoke this agent
```