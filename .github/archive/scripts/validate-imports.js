#!/usr/bin/env node

/**
 * validate-imports.js
 *
 * Purpose: Validate all imports before commit to prevent broken workflows
 * Usage: node .github/scripts/validate-imports.js [file...]
 * Exit codes: 0 = success, 1 = validation failed
 *
 * Pre-commit hook usage:
 *   - Validates all staged .js files
 *   - Checks for undefined/broken imports
 *   - Verifies relative imports exist
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

/**
 * Extract all imports from a JavaScript file
 */
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];

  // Remove comments to avoid matching strings in them
  const contentWithoutComments = content
    .replace(/\/\/.*$/gm, '')           // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove multi-line comments
    .replace(/\/\/.*/g, '');             // Remove any remaining single-line comments

  // Match: require('...'), require("..."), import ... from '...'
  const patterns = [
    /require\(['"]([^'"]+)['"]\)/g,
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g
  ];

  patterns.forEach(pattern => {
    let match;
    // Use contentWithoutComments for matching
    const textToSearch = contentWithoutComments;

    while ((match = pattern.exec(textToSearch)) !== null) {
      const module = match[1];
      // Find line number by searching in original content
      const moduleSearchStr = match[0];
      const moduleIndex = content.indexOf(moduleSearchStr);
      const line = content.substring(0, moduleIndex < 0 ? 0 : moduleIndex).split('\n').length;

      imports.push({
        module: module,
        line: line
      });
    }
  });

  return imports;
}

/**
 * Check if a module can be resolved
 */
function canResolve(importPath, fromFile) {
  // Node.js built-ins
  const builtIns = ['fs', 'path', 'http', 'https', 'url', 'os', 'crypto', 'util', 'events', 'stream', 'buffer', 'child_process', 'cluster', 'net', 'tls', 'dgram', 'dns', 'zlib'];
  if (builtIns.includes(importPath)) {
    return { valid: true, type: 'builtin' };
  }

  // External packages (no dot or slash in name)
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    try {
      // Check if package exists in node_modules
      const moduleDir = path.dirname(fromFile);
      const packagePaths = [
        path.join(process.cwd(), 'node_modules', importPath),
        path.join(moduleDir, 'node_modules', importPath),
        path.join(process.cwd(), 'jobboard', 'node_modules', importPath)
      ];

      for (const pkgPath of packagePaths) {
        if (fs.existsSync(pkgPath) || fs.existsSync(pkgPath + '.js')) {
          return { valid: true, type: 'external' };
        }
      }

      // Can't verify without actually requiring, but assume valid for external packages
      return { valid: true, type: 'external', warning: 'assumed valid (not runtime checked)' };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  // Relative imports
  try {
    const fromDir = path.dirname(fromFile);
    let resolvedPath = path.join(fromDir, importPath);

    // Try adding .js extension
    if (!importPath.endsWith('.js')) {
      if (fs.existsSync(resolvedPath + '.js')) {
        return { valid: true, type: 'relative' };
      }
      // Try as directory with index.js
      if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
        return { valid: true, type: 'relative' };
      }
    }

    // Check exact path
    if (fs.existsSync(resolvedPath)) {
      return { valid: true, type: 'relative' };
    }

    return { valid: false, error: 'file not found' };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

/**
 * Validate a single file
 */
function validateFile(filePath) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(filePath)) {
    return { errors: [`File not found: ${filePath}`], warnings };
  }

  const imports = extractImports(filePath);

  imports.forEach(({ module, line }) => {
    const result = canResolve(module, filePath);

    if (!result.valid) {
      errors.push(`${filePath}:${line} - Cannot resolve '${module}': ${result.error}`);
    } else if (result.warning) {
      warnings.push(`${filePath}:${line} - '${module}': ${result.warning}`);
    }
  });

  return { errors, warnings };
}

/**
 * Get all staged JavaScript files
 */
function getStagedFiles() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output.split('\n').filter(f => f.endsWith('.js')).map(f => path.join(process.cwd(), f));
  } catch (e) {
    // Fallback: scan all .js files in .github/scripts
    const scriptsDir = path.join(process.cwd(), '.github', 'scripts');
    if (fs.existsSync(scriptsDir)) {
      const files = [];
      const scanDir = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        items.forEach(item => {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            scanDir(fullPath);
          } else if (item.name.endsWith('.js')) {
            files.push(fullPath);
          }
        });
      };
      scanDir(scriptsDir);
      return files;
    }
    return [];
  }
}

/**
 * Main validation
 */
function validate() {
  const args = process.argv.slice(2);
  let files = [];

  if (args.length > 0) {
    files = args.map(f => path.resolve(f));
  } else {
    files = getStagedFiles();
  }

  if (files.length === 0) {
    log(colors.yellow, 'ℹ️', 'No JavaScript files to validate');
    process.exit(0);
  }

  console.log('\n🔍 Validating imports...\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  files.forEach(file => {
    const { errors, warnings } = validateFile(file);

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n📄 ${path.relative(process.cwd(), file)}:`);
    }

    errors.forEach(err => {
      log(colors.red, '  ❌', err);
      totalErrors++;
    });

    warnings.forEach(warn => {
      log(colors.yellow, '  ⚠️', warn);
      totalWarnings++;
    });
  });

  console.log('\n' + '='.repeat(60));

  if (totalErrors > 0) {
    log(colors.red, '❌', `Found ${totalErrors} error(s), ${totalWarnings} warning(s)`);
    console.log('\nPlease fix import errors before committing.\n');
    process.exit(1);
  } else if (totalWarnings > 0) {
    log(colors.yellow, '⚠️', `Found ${totalWarnings} warning(s) (no errors)`);
    process.exit(0);
  } else {
    log(colors.green, '✅', 'All imports validated successfully');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  }
}

validate();
