#!/usr/bin/env npx tsx

/**
 * Script to analyze admin dashboard styling issues
 * Identifies undefined Tailwind classes and color contrast problems
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface StyleIssue {
  file: string;
  line: number;
  issue: string;
  suggestion: string;
}

const TAILWIND_CONFIG_COLORS = {
  'speakeasy-green': '#2E5F45',
  'speakeasy-charcoal': '#1A1A1A',
  'speakeasy-cream': '#F5F5DC',
  'gold': '#D4AF37',
  'gold-light': '#E6C757',
  'gold-dark': '#B89830',
  'burgundy': '#722F37',
  'burgundy-light': '#8B3A42',
  'burgundy-dark': '#5A252B'
};

const UNDEFINED_CLASSES = [
  'prohibition-dark',
  'prohibition-gold',
  'prohibition-cream'
];

async function analyzeFile(filePath: string): Promise<StyleIssue[]> {
  const issues: StyleIssue[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      UNDEFINED_CLASSES.forEach(undefinedClass => {
        if (line.includes(undefinedClass)) {
          let suggestion = '';
          switch (undefinedClass) {
            case 'prohibition-dark':
              suggestion = 'Use speakeasy-charcoal (#1A1A1A) or burgundy-dark (#5A252B)';
              break;
            case 'prohibition-gold':
              suggestion = 'Use gold (#D4AF37) or gold-light (#E6C757)';
              break;
            case 'prohibition-cream':
              suggestion = 'Use speakeasy-cream (#F5F5DC)';
              break;
          }

          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Undefined Tailwind class: ${undefinedClass}`,
            suggestion
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return issues;
}

function calculateColorContrast(color1: string, color2: string): number {
  // Simple contrast ratio calculation (simplified)
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

async function main() {
  console.log('🔍 Analyzing Admin Dashboard Styling Issues\n');

  const filesToAnalyze = [
    '/home/cdev/booking-system-only-nextjs/app/admin/dashboard/layout.tsx',
    '/home/cdev/booking-system-only-nextjs/app/admin/dashboard/page.tsx',
    '/home/cdev/booking-system-only-nextjs/app/admin/dashboard/bookings/page.tsx',
    '/home/cdev/booking-system-only-nextjs/app/admin/dashboard/settings/page.tsx'
  ];

  const allIssues: StyleIssue[] = [];

  for (const file of filesToAnalyze) {
    const issues = await analyzeFile(file);
    allIssues.push(...issues);
  }

  console.log('📋 STYLING ISSUES FOUND:');
  console.log('=' .repeat(50));

  if (allIssues.length === 0) {
    console.log('✅ No undefined Tailwind classes found!');
  } else {
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file.split('/').pop()} (Line ${issue.line})`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Fix: ${issue.suggestion}\n`);
    });
  }

  console.log('\n🎨 COLOR CONTRAST ANALYSIS:');
  console.log('=' .repeat(50));

  // Analyze problematic color combinations from the current layout
  const contrastTests = [
    {
      bg: TAILWIND_CONFIG_COLORS['speakeasy-charcoal'],
      fg: TAILWIND_CONFIG_COLORS['speakeasy-cream'],
      name: 'Dark sidebar background + Cream text'
    },
    {
      bg: TAILWIND_CONFIG_COLORS['gold'],
      fg: TAILWIND_CONFIG_COLORS['speakeasy-charcoal'],
      name: 'Gold background + Dark text'
    }
  ];

  contrastTests.forEach(test => {
    const ratio = calculateColorContrast(test.bg, test.fg);
    const wcagLevel = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
    console.log(`${test.name}: ${ratio.toFixed(2)}:1 (${wcagLevel})`);
  });

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('=' .repeat(50));
  console.log('1. Replace undefined prohibition-* classes with defined Tailwind colors');
  console.log('2. Use speakeasy-charcoal for dark backgrounds');
  console.log('3. Use speakeasy-cream for light text on dark backgrounds');
  console.log('4. Use gold for accent colors and highlights');
  console.log('5. Ensure minimum 4.5:1 contrast ratio for WCAG AA compliance');

  // Generate fix suggestions
  const fixSuggestions = {
    'prohibition-dark': 'speakeasy-charcoal',
    'prohibition-gold': 'gold',
    'prohibition-cream': 'speakeasy-cream'
  };

  console.log('\n🔧 AUTOMATED FIX SUGGESTIONS:');
  console.log('=' .repeat(50));
  Object.entries(fixSuggestions).forEach(([old, newClass]) => {
    console.log(`Replace: ${old} → ${newClass}`);
  });
}

main().catch(console.error);