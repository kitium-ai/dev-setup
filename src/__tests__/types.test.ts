/**
 * Unit tests for dev-setup types
 */

import { describe, it, expect } from 'vitest';
import {
  DevTool,
  Editor,
  SetupError,
  type OperatingSystem,
  type PackageManager,
  type SetupContext,
  type SetupConfig,
} from '../types';

describe('Dev Setup Types', () => {
  describe('DevTool enum', () => {
    it('should have correct enum values', () => {
      expect(DevTool.Git).toBe('git');
      expect(DevTool.Node).toBe('node');
      expect(DevTool.GraphViz).toBe('graphviz');
      expect(DevTool.Python).toBe('python');
    });

    it('should have all expected tools', () => {
      const tools = Object.values(DevTool);
      expect(tools).toContain('git');
      expect(tools).toContain('node');
      expect(tools).toContain('graphviz');
      expect(tools).toContain('python');
    });
  });

  describe('Editor enum', () => {
    it('should have correct enum values', () => {
      expect(Editor.VSCode).toBe('vscode');
      expect(Editor.Cursor).toBe('cursor');
      expect(Editor.Antigravity).toBe('antigravity');
    });

    it('should have all expected editors', () => {
      const editors = Object.values(Editor);
      expect(editors).toContain('vscode');
      expect(editors).toContain('cursor');
      expect(editors).toContain('antigravity');
    });
  });

  describe('SetupError class', () => {
    it('should construct with message only', () => {
      const error = new SetupError('Setup failed');
      expect(error.message).toBe('Setup failed');
      expect(error.tool).toBeUndefined();
      expect(error.platform).toBeUndefined();
      expect(error.command).toBeUndefined();
    });

    it('should construct with all parameters', () => {
      const command = ['git', 'clone'];
      const error = new SetupError('Clone failed', DevTool.Git, 'win32', command);

      expect(error.message).toBe('Clone failed');
      expect(error.tool).toBe(DevTool.Git);
      expect(error.platform).toBe('win32');
      expect(error.command).toEqual(command);
    });

    it('should be instanceof Error', () => {
      const error = new SetupError('Test');
      expect(error instanceof Error).toBe(true);
    });

    it('should have correct name property', () => {
      const error = new SetupError('Test');
      expect(error.name).toBe('SetupError');
    });

    it('should preserve stack trace', () => {
      const error = new SetupError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('Type contracts', () => {
    it('should accept valid OperatingSystem type', () => {
      const platforms: OperatingSystem[] = ['win32', 'darwin', 'linux'];
      expect(platforms).toHaveLength(3);
    });

    it('should accept valid PackageManager type', () => {
      const managers: PackageManager[] = ['chocolatey', 'homebrew', 'apt', 'brew'];
      expect(managers).toHaveLength(4);
    });

    it('should accept valid SetupContext interface', () => {
      const context: SetupContext = {
        platform: 'win32',
        packageManager: 'chocolatey',
        installedTools: new Set([DevTool.Git]),
        installedEditors: new Set([Editor.VSCode]),
        taskResults: [
          {
            name: 'Git Installation',
            status: 'success',
            message: 'Git installed successfully',
          },
        ],
      };

      expect(context.platform).toBe('win32');
      expect(context.packageManager).toBe('chocolatey');
      expect(context.installedTools.size).toBe(1);
      expect(context.installedEditors.size).toBe(1);
      expect(context.taskResults.length).toBe(1);
    });

    it('should accept valid SetupConfig interface', () => {
      const config: SetupConfig = {
        skipTools: [DevTool.Python],
        skipEditors: [Editor.Cursor],
        interactive: true,
        verbose: true,
        logLevel: 'debug',
      };

      expect(config.skipTools).toContain(DevTool.Python);
      expect(config.skipEditors).toContain(Editor.Cursor);
      expect(config.interactive).toBe(true);
      expect(config.verbose).toBe(true);
      expect(config.logLevel).toBe('debug');
    });

    it('should accept partial SetupConfig', () => {
      const config: SetupConfig = {
        verbose: true,
      };

      expect(config.verbose).toBe(true);
      expect(config.skipTools).toBeUndefined();
      expect(config.skipEditors).toBeUndefined();
    });
  });

  describe('SetupTaskResult type', () => {
    it('should accept success result', () => {
      const result = {
        name: 'Installation',
        status: 'success' as const,
        message: 'Completed',
      };

      expect(result.status).toBe('success');
      expect(result.message).toBe('Completed');
    });

    it('should accept skipped result', () => {
      const result = {
        name: 'Optional Tool',
        status: 'skipped' as const,
      };

      expect(result.status).toBe('skipped');
    });

    it('should accept failed result', () => {
      const error = new Error('Installation failed');
      const result = {
        name: 'Installation',
        status: 'failed' as const,
        message: 'Failed to install',
        error,
      };

      expect(result.status).toBe('failed');
      expect(result.error).toBe(error);
    });
  });

  describe('Type compatibility', () => {
    it('should maintain DevTool and Editor as distinct types', () => {
      const tool: DevTool = DevTool.Git;
      const editor: Editor = Editor.VSCode;

      expect(tool).not.toBe(editor);
      expect(typeof tool).toBe('string');
      expect(typeof editor).toBe('string');
    });

    it('should allow mixed setup context with multiple types', () => {
      const context: SetupContext = {
        platform: 'darwin',
        packageManager: 'homebrew',
        installedTools: new Set([DevTool.Git, DevTool.Node, DevTool.Python]),
        installedEditors: new Set([Editor.VSCode, Editor.Cursor]),
        taskResults: [
          {
            name: 'Git',
            status: 'success',
            message: 'Installed',
          },
          {
            name: 'Python',
            status: 'failed',
            message: 'Already installed',
          },
          {
            name: 'Antigravity',
            status: 'skipped',
          },
        ],
      };

      expect(context.installedTools.size).toBe(3);
      expect(context.installedEditors.size).toBe(2);
      expect(context.taskResults.length).toBe(3);
    });
  });
});
