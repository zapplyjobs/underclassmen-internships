const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Captures system state at time of failure
 * Used for post-mortem analysis
 */
class DiagnosticSnapshot {
  constructor(options = {}) {
    this.timestamp = new Date().toISOString();
    this.workingDirectory = options.cwd || process.cwd();
    this.captureLevel = options.level || 'standard'; // minimal, standard, verbose
  }

  async capture() {
    const snapshot = {
      timestamp: this.timestamp,
      system: await this.captureSystemInfo(),
      git: await this.captureGitInfo(),
      files: await this.captureFileInfo(),
      environment: await this.captureEnvironment(),
      processes: await this.captureProcessInfo()
    };

    if (this.captureLevel === 'verbose') {
      snapshot.logs = await this.captureRecentLogs();
      snapshot.metrics = await this.captureMetrics();
    }

    return snapshot;
  }

  async captureSystemInfo() {
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        total: process.memoryUsage().heapTotal,
        used: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      uptime: process.uptime()
    };
  }

  async captureGitInfo() {
    try {
      return {
        branch: execSync('git branch --show-current', { cwd: this.workingDirectory }).toString().trim(),
        commit: execSync('git rev-parse HEAD', { cwd: this.workingDirectory }).toString().trim(),
        status: execSync('git status --porcelain', { cwd: this.workingDirectory }).toString(),
        remote: execSync('git remote get-url origin', { cwd: this.workingDirectory }).toString().trim(),
        lastCommit: {
          message: execSync('git log -1 --pretty=%B', { cwd: this.workingDirectory }).toString().trim(),
          author: execSync('git log -1 --pretty=%an', { cwd: this.workingDirectory }).toString().trim(),
          date: execSync('git log -1 --pretty=%ai', { cwd: this.workingDirectory }).toString().trim()
        }
      };
    } catch (error) {
      return { error: 'Git info unavailable', message: error.message };
    }
  }

  async captureFileInfo() {
    const criticalFiles = [
      'package.json',
      '.github/workflows/*.yml',
      '.github/data/current_jobs.json',
      '.github/data/workflow_metrics.json'
    ];

    const fileInfo = {};
    for (const pattern of criticalFiles) {
      try {
        const files = await this.globFiles(pattern);
        for (const file of files) {
          const stats = await fs.stat(file);
          fileInfo[file] = {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            exists: true
          };
        }
      } catch (error) {
        fileInfo[pattern] = { exists: false, error: error.message };
      }
    }

    return fileInfo;
  }

  async captureEnvironment() {
    return {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
        GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
        GITHUB_SHA: process.env.GITHUB_SHA,
        GITHUB_RUN_ID: process.env.GITHUB_RUN_ID
      },
      secrets: {
        JSEARCH_API_KEY: process.env.JSEARCH_API_KEY ? 'SET' : 'MISSING',
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'SET' : 'MISSING'
      }
    };
  }

  async captureProcessInfo() {
    return {
      pid: process.pid,
      ppid: process.ppid,
      argv: process.argv,
      execPath: process.execPath,
      cwd: process.cwd()
    };
  }

  async captureRecentLogs() {
    // Read last 50 lines from workflow logs if available
    const logPath = path.join(this.workingDirectory, '.github', 'logs', 'latest.log');
    try {
      const logContent = await fs.readFile(logPath, 'utf-8');
      const lines = logContent.split('\n');
      return lines.slice(-50).join('\n');
    } catch {
      return 'Logs not available';
    }
  }

  async captureMetrics() {
    const metricsPath = path.join(this.workingDirectory, '.github', 'data', 'workflow_metrics.json');
    try {
      const metrics = await fs.readFile(metricsPath, 'utf-8');
      return JSON.parse(metrics);
    } catch {
      return null;
    }
  }

  async globFiles(pattern) {
    // Simple glob implementation for workflow files
    const dir = path.dirname(pattern);
    const filename = path.basename(pattern);

    // Handle non-glob patterns
    if (!filename.includes('*')) {
      const fullPath = path.join(this.workingDirectory, pattern);
      try {
        await fs.access(fullPath);
        return [fullPath];
      } catch {
        return [];
      }
    }

    // Handle glob patterns
    try {
      const fullDir = path.join(this.workingDirectory, dir);
      const files = await fs.readdir(fullDir);
      const regex = new RegExp('^' + filename.replace(/\*/g, '.*') + '$');
      return files
        .filter(f => regex.test(f))
        .map(f => path.join(fullDir, f));
    } catch {
      return [];
    }
  }
}

module.exports = { DiagnosticSnapshot };
