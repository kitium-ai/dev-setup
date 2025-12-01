/**
 * Development setup utility functions
 * Pure functions for OS and tool detection, validation
 */

import os from 'os';
import { execFileSync } from 'child_process';
import { isString, isNil, isError } from '@kitiumai/utils-ts';
import { execa } from 'execa';
import {
  DevTool,
  Editor,
  type OperatingSystem,
  type PackageManager,
  type SetupContext,
  type PreflightResult,
} from './types.js';

/**
 * Detect the current operating system
 */
export function detectOperatingSystem(): OperatingSystem {
  const platform = os.platform();

  if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
    return platform as OperatingSystem;
  }

  return 'linux';
}

/**
 * Get appropriate package manager for the platform
 */
export function getPackageManager(platform: OperatingSystem): PackageManager | undefined {
  const availability = detectPackageManagerAvailability(platform);
  const preferredOrder: Record<OperatingSystem, PackageManager[]> = {
    win32: ['chocolatey', 'winget', 'scoop'],
    darwin: ['homebrew', 'brew'],
    linux: ['apt', 'yum', 'zypper', 'pacman'],
  };

  return preferredOrder[platform].find((manager) => availability.has(manager));
}

/**
 * Validate setup context
 */
export function validateSetupContext(context: unknown): context is SetupContext {
  if (!context || typeof context !== 'object') {
    return false;
  }

  const ctx = context as Record<string, unknown>;
  return (
    isString(ctx.platform) &&
    (!isNil(ctx.packageManager) ? isString(ctx.packageManager) : true) &&
    ctx.installedTools instanceof Set &&
    ctx.installedEditors instanceof Set &&
    Array.isArray(ctx.taskResults)
  );
}

/**
 * Create initial setup context
 */
export function createSetupContext(): SetupContext {
  const platform = detectOperatingSystem();
  const packageManager = getPackageManager(platform);

  return {
    platform,
    packageManager,
    installedTools: new Set(),
    installedEditors: new Set(),
    taskResults: [],
    metrics: { taskTimings: {}, attempts: {} },
  };
}

/**
 * Get package manager installation instruction
 */
export function getPackageManagerInstruction(
  platform: OperatingSystem
): { name: string; command: string; url: string } | undefined {
  const instructions: Record<
    OperatingSystem,
    { name: string; command: string; url: string } | undefined
  > = {
    win32: {
      name: 'Chocolatey',
      command: 'Run PowerShell as Administrator and execute provided script',
      url: 'https://chocolatey.org/install',
    },
    darwin: {
      name: 'Homebrew',
      command:
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      url: 'https://brew.sh',
    },
    linux: {
      name: 'APT',
      command: 'sudo apt-get update && sudo apt-get install -y',
      url: 'https://wiki.debian.org/Apt',
    },
  };

  return instructions[platform];
}

/**
 * Format error message with context
 */
export function formatErrorMessage(
  error: unknown,
  tool?: DevTool | Editor,
  platform?: OperatingSystem
): string {
  if (isError(error)) {
    const message = error.message;
    if (tool && platform) {
      return `Failed to install ${tool} on ${platform}: ${message}`;
    }
    return message;
  }

  return 'An unknown error occurred';
}

/**
 * Create a safe async wrapper for command execution
 */
export async function safeExecuteCommand<T>(
  fn: () => Promise<T>,
  fallback: T,
  options?: {
    tool?: DevTool | Editor;
    platform?: OperatingSystem;
    retries?: number;
    backoffMs?: number;
    dryRun?: boolean;
    commandLabel?: string;
  }
): Promise<T> {
  if (options?.dryRun) {
    return fallback;
  }

  const retries = options?.retries ?? 0;
  const backoffMs = options?.backoffMs ?? 300;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) {
        return fallback;
      }
      attempt += 1;
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (options?.commandLabel) {
        // eslint-disable-next-line no-console
        console.warn(`Retrying ${options.commandLabel} (attempt ${attempt + 1}/${retries + 1})`);
      }
    }
  }
}

/**
 * Validate that required tools are available
 */
export function isToolAvailable(_toolName: string): boolean {
  try {
    const command = os.platform() === 'win32' ? 'where' : 'command';
    const args = os.platform() === 'win32' ? [_toolName] : ['-v', _toolName];
    execFileSync(command, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Group tools by category
 */
export function groupToolsByPriority(tools: DevTool[]): {
  essential: DevTool[];
  optional: DevTool[];
} {
  const essential = [DevTool.Git, DevTool.Node];
  return {
    essential: tools.filter((t) => essential.includes(t)),
    optional: tools.filter((t) => !essential.includes(t)),
  };
}

/**
 * Detect available package managers for the platform
 */
export function detectPackageManagerAvailability(platform: OperatingSystem): Set<PackageManager> {
  const detected = new Set<PackageManager>();
  const checks: Record<PackageManager, string[]> = {
    chocolatey: ['choco', '-v'],
    winget: ['winget', '--version'],
    scoop: ['scoop', '-v'],
    homebrew: ['brew', '--version'],
    brew: ['brew', '--version'],
    apt: ['apt-get', '--version'],
    yum: ['yum', '--version'],
    zypper: ['zypper', '--version'],
    pacman: ['pacman', '-V'],
  };

  Object.entries(checks).forEach(([manager, args]) => {
    if (platform === 'win32' && !['chocolatey', 'winget', 'scoop'].includes(manager)) return;
    if (platform === 'darwin' && !['homebrew', 'brew'].includes(manager)) return;
    if (platform === 'linux' && ['chocolatey', 'winget', 'scoop', 'homebrew', 'brew'].includes(manager)) return;
    try {
      execFileSync(args[0] as string, args.slice(1), { stdio: 'ignore' });
      detected.add(manager as PackageManager);
    } catch {
      // ignore
    }
  });

  return detected;
}

/**
 * Detect whether sudo/admin rights are present
 */
export function detectPrivilege(): boolean {
  if (os.platform() === 'win32') {
    try {
      execFileSync('fsutil', ['dirty', 'query', '%systemdrive%'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  return process.getuid ? process.getuid() === 0 : false;
}

/**
 * Perform preflight checks for connectivity and disk
 */
export async function runPreflightChecks(): Promise<PreflightResult> {
  const warnings: string[] = [];
  const hasSudo = detectPrivilege();

  if (!hasSudo) {
    warnings.push('Elevated privileges not detected; some installs may fail.');
  }

  const diskSpaceMb = await detectDiskSpaceMb();
  if (diskSpaceMb !== undefined && diskSpaceMb < 2048) {
    warnings.push('Low disk space detected (<2GB).');
  }

  const networkReachable = await detectNetworkReachability();
  if (!networkReachable) {
    warnings.push('Network reachability check failed; offline mode recommended.');
  }

  return { hasSudo, diskSpaceMb, networkReachable, warnings };
}

async function detectDiskSpaceMb(): Promise<number | undefined> {
  if (os.platform() === 'win32') {
    try {
      const { stdout } = await execa('wmic', ['logicaldisk', 'where', "DeviceID='%SYSTEMDRIVE%'", 'get', 'FreeSpace']);
      const lines = stdout.trim().split(/\s+/).filter(Boolean);
      const freeBytes = Number(lines[1]);
      return Number.isFinite(freeBytes) ? Math.floor(freeBytes / (1024 * 1024)) : undefined;
    } catch {
      return undefined;
    }
  }

  try {
    const { stdout } = await execa('df', ['-Pk', '.']);
    const [, data] = stdout.trim().split('\n');
    if (!data) return undefined;
    const parts = data.split(/\s+/);
    const availableKb = Number(parts[3]);
    return Number.isFinite(availableKb) ? Math.floor(availableKb / 1024) : undefined;
  } catch {
    return undefined;
  }
}

async function detectNetworkReachability(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch('https://registry.npmjs.org', { method: 'HEAD', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
