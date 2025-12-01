/**
 * Development Setup CLI
 * Enterprise-ready setup utility using @kitiumai packages
 */

import { Command } from 'commander';
import { Listr } from 'listr2';
import { execa } from 'execa';
import chalk from 'chalk';
import { createLogger } from '@kitiumai/logger';
import { isError, compact } from '@kitiumai/utils-ts';
import {
  createSetupContext,
  detectOperatingSystem,
  getPackageManager,
  getPackageManagerInstruction,
  safeExecuteCommand,
  validateSetupContext,
} from './utils.js';
import { DevTool, Editor, type SetupContext, type SetupConfig } from './types.js';
import {
  createSetupContextError,
  createPackageManagerError,
  createToolInstallationError,
  createEditorInstallationError,
  createCommandExecutionError,
  extractErrorMetadata,
} from './utils/errors.js';

const logger = createLogger('dev-setup:cli');

/**
 * Log task result
 */
function logTaskResult(
  name: string,
  status: 'success' | 'skipped' | 'failed',
  message?: string
): void {
  const logData = {
    name,
    status,
    ...(message && { message }),
  };

  if (status === 'success') {
    logger.info(`Task completed: ${name}`, logData);
  } else if (status === 'skipped') {
    logger.warn(`Task skipped: ${name}`, logData);
  } else {
    logger.error(`Task failed: ${name}`, logData);
  }
}

const program = new Command();

program
  .name('dev-setup')
  .description('Setup development environment for KitiumAI')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--skip-tools <tools>', 'Skip specific tools (comma-separated)')
  .option('--skip-editors <editors>', 'Skip specific editors (comma-separated)')
  .option('--interactive', 'Run in interactive mode');

/**
 * Main setup action handler
 */
program.action(
  async (options: {
    verbose?: boolean;
    skipTools?: string;
    skipEditors?: string;
    interactive?: boolean;
  }) => {
    logger.info('Starting KitiumAI Development Environment Setup', {
      options,
      timestamp: new Date().toISOString(),
    });

    console.log(chalk.bold.blue('🚀 Starting KitiumAI Development Environment Setup\n'));

    // Initialize setup configuration
    const config: SetupConfig = {
      verbose: options.verbose,
      interactive: options.interactive,
      skipTools: options.skipTools ? (options.skipTools.split(',') as DevTool[]) : undefined,
      skipEditors: options.skipEditors ? (options.skipEditors.split(',') as Editor[]) : undefined,
    };

    // Create setup context
    const context = createSetupContext();

    // Validate context
    if (!validateSetupContext(context)) {
      const contextError = createSetupContextError('Unable to initialize setup context');
      const errorMetadata = extractErrorMetadata(contextError);
      logger.error('Setup context validation failed', { ...errorMetadata });
      console.error(chalk.red('❌ Setup failed: Invalid setup context'));
      process.exit(1);
    }

    logger.debug('Setup context created', {
      platform: context.platform,
      packageManager: context.packageManager,
    });

    const tasks = new Listr<SetupContext>(
      [
        {
          title: 'Check Operating System',
          task: async (_ctx) => {
            try {
              const platform = detectOperatingSystem();
              const platformName =
                platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux';

              logger.info('Operating system detected', { platform, platformName });
              logTaskResult('OS Detection', 'success', `${platformName} detected`);
            } catch (error) {
              const message = isError(error) ? error.message : 'Unknown error';
              logger.error('OS detection failed', { error: message });
              logTaskResult('OS Detection', 'failed', message);
              throw error;
            }
          },
        },
        {
          title: 'Check Package Manager',
          task: async (_ctx) => {
            try {
              const manager = getPackageManager(context.platform);

              if (!manager) {
                throw createPackageManagerError(
                  'detection',
                  'unknown',
                  'No package manager available for this platform',
                  { platform: context.platform }
                );
              }

              const instruction = getPackageManagerInstruction(context.platform);

              await safeExecuteCommand(
                async () => {
                  if (manager === 'chocolatey') {
                    await execa('choco', ['--version']);
                  } else if (manager === 'homebrew') {
                    await execa('brew', ['--version']);
                  } else if (manager === 'apt') {
                    await execa('apt-get', ['--version']);
                  }
                  return true;
                },
                false,
                {
                  tool: 'package-manager' as unknown as DevTool | Editor,
                  platform: context.platform,
                }
              ).catch(() => {
                const message = `${manager} is not installed. Please install from: ${instruction?.url}`;
                logger.warn(message, { manager });
                logTaskResult(`${manager} Check`, 'skipped', message);
                return false;
              });

              logTaskResult(`${manager} Check`, 'success');
            } catch (error) {
              const message = isError(error) ? error.message : 'Unknown error';
              logger.error('Package manager check failed', { error: message });
              logTaskResult('Package Manager Check', 'failed', message);
            }
          },
        },
        {
          title: 'Install Core Tools',
          task: async (_ctx) => {
            if (
              config.skipTools?.includes(DevTool.Git) &&
              config.skipTools?.includes(DevTool.Node)
            ) {
              logger.info('Skipping core tools installation as requested');
              return;
            }

            const coreTools =
              context.platform === 'win32'
                ? ['git', 'nodejs-lts', 'graphviz', 'python']
                : ['git', 'node', 'graphviz', 'python'];

            try {
              const installStartTime = Date.now();
              logger.info('Installing core tools', {
                platform: context.platform,
                tools: coreTools,
              });

              await safeExecuteCommand(
                async () => {
                  if (context.platform === 'win32' && context.packageManager === 'chocolatey') {
                    await execa('choco', ['install', '-y', ...coreTools]);
                  } else if (
                    context.platform === 'darwin' &&
                    context.packageManager === 'homebrew'
                  ) {
                    await execa('brew', ['install', ...coreTools]);
                  } else {
                    logger.warn('Manual installation required for this platform');
                    return;
                  }
                },
                undefined,
                { platform: context.platform }
              );

              const installDuration = Date.now() - installStartTime;
              logger.info('Core tools installation completed', {
                duration: installDuration,
                tools: coreTools,
              });
              logTaskResult('Core Tools Installation', 'success');
            } catch (error) {
              const message = isError(error) ? error.message : 'Unknown error';
              const toolError = createToolInstallationError(
                coreTools.join(', '),
                context.platform,
                message
              );
              const errorMetadata = extractErrorMetadata(toolError);
              logger.error('Core tools installation failed', {
                ...errorMetadata,
                platform: context.platform,
              });
              logTaskResult('Core Tools Installation', 'failed', message);
            }
          },
        },
        {
          title: 'Install Editors',
          task: async (_ctx) => {
            if (config.skipEditors?.length === Object.keys(Editor).length) {
              logger.info('Skipping editors installation as requested');
              return;
            }

            const editors =
              context.platform === 'win32'
                ? [
                    { name: 'VSCode', package: 'vscode', tool: Editor.VSCode },
                    { name: 'Cursor', package: 'cursor', tool: Editor.Cursor },
                    { name: 'Antigravity', package: 'antigravity', tool: Editor.Antigravity },
                  ]
                : [
                    { name: 'VSCode', package: 'visual-studio-code', tool: Editor.VSCode },
                    { name: 'Cursor', package: 'cursor', tool: Editor.Cursor },
                    { name: 'Antigravity', package: 'antigravity', tool: Editor.Antigravity },
                  ];

            return new Listr(
              editors.map((editor) => ({
                title: editor.name,
                task: async (_subCtx) => {
                  if (config.skipEditors?.includes(editor.tool)) {
                    logger.info(`Skipping ${editor.name} installation`);
                    return;
                  }

                  try {
                    const editorStartTime = Date.now();
                    if (context.platform === 'win32') {
                      await execa('choco', ['install', '-y', editor.package]);
                    } else if (context.platform === 'darwin') {
                      await execa('brew', ['install', '--cask', editor.package]);
                    }

                    const editorDuration = Date.now() - editorStartTime;
                    logger.info(`${editor.name} installed successfully`, {
                      editor: editor.name,
                      duration: editorDuration,
                    });
                    context.installedEditors.add(editor.tool);
                    logTaskResult(`${editor.name} Installation`, 'success');
                  } catch (error) {
                    const message = isError(error) ? error.message : 'Unknown error';
                    const editorError = createEditorInstallationError(
                      editor.name,
                      context.platform,
                      message
                    );
                    const errorMetadata = extractErrorMetadata(editorError);
                    logger.warn(`Failed to install ${editor.name}`, { ...errorMetadata });
                    logTaskResult(
                      `${editor.name} Installation`,
                      'skipped',
                      `Please install manually from ${editor.name} website`
                    );
                  }
                },
              })),
              { concurrent: false }
            );
          },
        },
        {
          title: 'Setup Node.js Tools',
          task: async (_ctx) => {
            try {
              const corepackStartTime = Date.now();
              logger.info('Enabling corepack');
              await execa('corepack', ['enable']);
              const corepackDuration = Date.now() - corepackStartTime;
              logger.info('Corepack enabled successfully', { duration: corepackDuration });
              logTaskResult('Corepack Setup', 'success');
            } catch (error) {
              const message = isError(error) ? error.message : 'Unknown error';
              const cmdError = createCommandExecutionError('corepack enable', 1, message);
              const errorMetadata = extractErrorMetadata(cmdError);
              logger.error('Corepack setup failed', { ...errorMetadata });
              logTaskResult('Corepack Setup', 'failed', message);
              throw error;
            }
          },
        },
      ],
      { renderer: 'default' }
    );

    const setupStartTime = Date.now();
    try {
      await tasks.run(context);

      const setupDuration = Date.now() - setupStartTime;
      const completedEditors = Array.from(context.installedEditors);
      const taskSuccessCount = compact(
        context.taskResults.map((t) => (t.status === 'success' ? t : null))
      ).length;

      logger.info('Setup completed successfully', {
        duration: setupDuration,
        completedAt: new Date().toISOString(),
        installedTools: Array.from(context.installedTools),
        installedEditors: completedEditors,
        taskSuccessCount,
        totalTasks: context.taskResults.length,
      });

      console.log(chalk.green('\n✅ Setup complete!'));
      console.log(chalk.gray('\nSetup Summary:'));
      console.log(chalk.gray(`  Platform: ${context.platform}`));
      console.log(chalk.gray(`  Package Manager: ${context.packageManager}`));
      console.log(chalk.gray(`  Installed Editors: ${completedEditors.join(', ') || 'none'}`));
      console.log(chalk.gray(`  Duration: ${setupDuration}ms`));
    } catch (error) {
      const setupDuration = Date.now() - setupStartTime;
      const message = isError(error) ? error.message : 'Unknown error occurred';

      logger.error('Setup failed', {
        duration: setupDuration,
        error: message,
        stack: isError(error) ? error.stack : undefined,
        context: {
          platform: context.platform,
          packageManager: context.packageManager,
        },
      });

      console.error(chalk.red('\n❌ Setup failed'));
      console.error(chalk.red(message));

      if (config.verbose && isError(error)) {
        console.error(chalk.gray('\nError details:'));
        console.error(error.stack);
      }

      process.exit(1);
    }
  }
);

program.parse();
