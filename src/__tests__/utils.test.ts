/**
 * Unit tests for dev-setup utilities
 */

import { describe, it, expect } from 'vitest';
import {
  detectOperatingSystem,
  getPackageManager,
  validateSetupContext,
  createSetupContext,
  getPackageManagerInstruction,
  formatErrorMessage,
  groupToolsByPriority,
  isToolAvailable,
} from '../utils';
import { DevTool, Editor, type SetupContext, SetupError } from '../types';

/**
 * Helper to create a test context with setup/teardown logging
 */
function createTestContext(): SetupContext {
  const context: SetupContext = {
    platform: 'win32',
    packageManager: 'chocolatey',
    installedTools: new Set(),
    installedEditors: new Set(),
    taskResults: [],
  };
  return context;
}

describe('Dev Setup Utilities', () => {
  describe('detectOperatingSystem', () => {
    it('should return the current operating system', () => {
      const os = detectOperatingSystem();
      expect(['win32', 'darwin', 'linux']).toContain(os);
    });
  });

  describe('getPackageManager', () => {
    it('should return chocolatey for Windows', () => {
      const manager = getPackageManager('win32');
      expect(manager).toBe('chocolatey');
    });

    it('should return homebrew for macOS', () => {
      const manager = getPackageManager('darwin');
      expect(manager).toBe('homebrew');
    });

    it('should return apt for Linux', () => {
      const manager = getPackageManager('linux');
      expect(manager).toBe('apt');
    });
  });

  describe('validateSetupContext', () => {
    it('should validate a correct setup context', () => {
      const context = createTestContext();
      expect(validateSetupContext(context)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateSetupContext(null)).toBe(false);
      expect(validateSetupContext(undefined)).toBe(false);
    });

    it('should reject invalid platform type', () => {
      const context = createTestContext();
      const invalid = { ...context, platform: 123 };
      expect(validateSetupContext(invalid)).toBe(false);
    });

    it('should reject invalid installedTools type', () => {
      const context = createTestContext();
      const invalid = { ...context, installedTools: [] };
      expect(validateSetupContext(invalid)).toBe(false);
    });

    it('should validate context without packageManager', () => {
      const contextNoManager = {
        platform: 'linux' as const,
        installedTools: new Set(),
        installedEditors: new Set(),
        taskResults: [],
      };
      expect(validateSetupContext(contextNoManager)).toBe(true);
    });
  });

  describe('createSetupContext', () => {
    it('should create a valid setup context', () => {
      const context = createSetupContext();
      expect(validateSetupContext(context)).toBe(true);
    });

    it('should initialize with empty sets', () => {
      const context = createSetupContext();
      expect(context.installedTools.size).toBe(0);
      expect(context.installedEditors.size).toBe(0);
      expect(context.taskResults.length).toBe(0);
    });

    it('should have a valid platform', () => {
      const context = createSetupContext();
      expect(['win32', 'darwin', 'linux']).toContain(context.platform);
    });

    it('should have matching package manager for platform', () => {
      const context = createSetupContext();
      const expected = getPackageManager(context.platform);
      expect(context.packageManager).toBe(expected);
    });
  });

  describe('getPackageManagerInstruction', () => {
    it('should return instruction for Windows', () => {
      const instruction = getPackageManagerInstruction('win32');
      expect(instruction).toBeDefined();
      expect(instruction?.name).toBe('Chocolatey');
      expect(instruction?.url).toContain('chocolatey');
    });

    it('should return instruction for macOS', () => {
      const instruction = getPackageManagerInstruction('darwin');
      expect(instruction).toBeDefined();
      expect(instruction?.name).toBe('Homebrew');
      expect(instruction?.url).toContain('brew');
    });

    it('should return instruction for Linux', () => {
      const instruction = getPackageManagerInstruction('linux');
      expect(instruction).toBeDefined();
      expect(instruction?.name).toBe('APT');
      expect(instruction?.url).toContain('apt');
    });

    it('should include command in instruction', () => {
      const instruction = getPackageManagerInstruction('win32');
      expect(instruction?.command).toBeDefined();
      expect(typeof instruction?.command).toBe('string');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format Error instance with all context', () => {
      const error = new Error('Test error');
      const message = formatErrorMessage(error, DevTool.Git, 'win32');
      expect(message).toContain('Failed to install');
      expect(message).toContain('git');
      expect(message).toContain('win32');
      expect(message).toContain('Test error');
    });

    it('should format Error instance without context', () => {
      const error = new Error('Test error');
      const message = formatErrorMessage(error);
      expect(message).toBe('Test error');
    });

    it('should handle non-Error objects', () => {
      const message = formatErrorMessage('string error');
      expect(message).toBe('An unknown error occurred');
    });

    it('should handle unknown objects', () => {
      const message = formatErrorMessage({ unknown: 'object' });
      expect(message).toBe('An unknown error occurred');
    });
  });

  describe('groupToolsByPriority', () => {
    it('should separate essential and optional tools', () => {
      const tools = [DevTool.Git, DevTool.Node, DevTool.GraphViz, DevTool.Python];
      const grouped = groupToolsByPriority(tools);

      expect(grouped.essential).toContain(DevTool.Git);
      expect(grouped.essential).toContain(DevTool.Node);
      expect(grouped.optional).toContain(DevTool.GraphViz);
      expect(grouped.optional).toContain(DevTool.Python);
    });

    it('should handle empty array', () => {
      const grouped = groupToolsByPriority([]);
      expect(grouped.essential).toHaveLength(0);
      expect(grouped.optional).toHaveLength(0);
    });

    it('should handle only essential tools', () => {
      const tools = [DevTool.Git, DevTool.Node];
      const grouped = groupToolsByPriority(tools);
      expect(grouped.essential).toHaveLength(2);
      expect(grouped.optional).toHaveLength(0);
    });

    it('should handle only optional tools', () => {
      const tools = [DevTool.GraphViz, DevTool.Python];
      const grouped = groupToolsByPriority(tools);
      expect(grouped.essential).toHaveLength(0);
      expect(grouped.optional).toHaveLength(2);
    });
  });

  describe('isToolAvailable', () => {
    it('should return a boolean', () => {
      const result = isToolAvailable('git');
      expect(typeof result).toBe('boolean');
    });

    it('should not throw on tool name', () => {
      expect(() => {
        isToolAvailable('any-tool');
      }).not.toThrow();
    });
  });

  describe('SetupError class', () => {
    it('should create error with message', () => {
      const error = new SetupError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SetupError');
    });

    it('should store tool context', () => {
      const error = new SetupError('Test error', DevTool.Git);
      expect(error.tool).toBe(DevTool.Git);
    });

    it('should store platform context', () => {
      const error = new SetupError('Test error', undefined, 'win32');
      expect(error.platform).toBe('win32');
    });

    it('should store command context', () => {
      const command = ['choco', 'install', 'git'];
      const error = new SetupError('Test error', undefined, undefined, command);
      expect(error.command).toEqual(command);
    });

    it('should be an instance of Error', () => {
      const error = new SetupError('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should create and validate context in sequence', () => {
      const context = createSetupContext();
      expect(validateSetupContext(context)).toBe(true);

      // Add some tools
      context.installedTools.add(DevTool.Git);
      context.installedTools.add(DevTool.Node);

      // Add some editors
      context.installedEditors.add(Editor.VSCode);

      // Should still be valid
      expect(validateSetupContext(context)).toBe(true);
      expect(context.installedTools.size).toBe(2);
      expect(context.installedEditors.size).toBe(1);
    });

    it('should handle errors in OS detection flow', () => {
      const os = detectOperatingSystem();
      const manager = getPackageManager(os);
      const instruction = getPackageManagerInstruction(os);

      expect(os).toBeDefined();
      expect(manager).toBeDefined();
      expect(instruction).toBeDefined();
    });
  });
});
