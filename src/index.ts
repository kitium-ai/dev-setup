import { Command } from 'commander';
import { Listr } from 'listr2';
import { execa } from 'execa';
import chalk from 'chalk';
import os from 'os';

const program = new Command();

program
  .name('dev-setup')
  .description('Setup development environment for KitiumAI')
  .version('0.0.1');

program.action(async () => {
  console.log(chalk.bold.blue('🚀 Starting KitiumAI Development Environment Setup'));

  const tasks = new Listr([
    {
      title: 'Check Operating System',
      task: (ctx, task) => {
        const platform = os.platform();
        if (platform === 'win32') {
          task.output = 'Windows detected';
        } else if (platform === 'darwin') {
          task.output = 'MacOS detected';
        } else {
          task.skip('This script is currently optimized for Windows and MacOS. Proceeding with caution.');
        }
      },
    },
    {
      title: 'Install Package Manager',
      task: async (ctx, task) => {
        if (os.platform() === 'win32') {
            task.title = 'Install Chocolatey (Windows)';
            try {
                await execa('choco', ['--version']);
                task.skip('Chocolatey is already installed');
            } catch (error) {
                task.output = 'Installing Chocolatey...';
                throw new Error('Chocolatey not found. Please install it manually or run this script as Administrator.');
            }
        } else if (os.platform() === 'darwin') {
            task.title = 'Install Homebrew (MacOS)';
            try {
                await execa('brew', ['--version']);
                task.skip('Homebrew is already installed');
            } catch (error) {
                task.output = 'Installing Homebrew...';
                // Homebrew install script requires interaction or specific env vars, 
                // typically users install it manually, but we can try the non-interactive one if possible
                // or just guide them.
                throw new Error('Homebrew not found. Please install it manually from brew.sh');
            }
        }
      },
    },
    {
      title: 'Install Core Tools',
      task: async (ctx, task) => {
        const tools = ['git', 'node', 'graphviz', 'python']; // 'node' in brew, 'nodejs-lts' in choco
        if (os.platform() === 'win32') {
             task.output = 'Checking and installing core tools...';
             const winTools = ['git', 'nodejs-lts', 'graphviz', 'python'];
             await execa('choco', ['install', '-y', ...winTools]);
        } else if (os.platform() === 'darwin') {
            task.output = 'Checking and installing core tools via Homebrew...';
            // brew install git node graphviz python
            await execa('brew', ['install', ...tools]);
        } else {
            task.skip('Manual installation required for Linux');
        }
      },
    },
    {
      title: 'Install Editors',
      task: async (ctx, task) => {
         if (os.platform() === 'win32') {
             return task.newListr([
                 {
                     title: 'VSCode',
                     task: async (subTask, subCtx) => {
                         subTask.output = 'Installing VSCode...';
                         await execa('choco', ['install', '-y', 'vscode']);
                     }
                 },
                 {
                     title: 'Cursor',
                     task: async (subTask, subCtx) => {
                         subTask.output = 'Installing Cursor...';
                         try {
                             await execa('choco', ['install', '-y', 'cursor']); 
                         } catch (e) {
                             subTask.skip('Cursor package not found in Chocolatey. Please install manually from cursor.sh');
                         }
                     }
                 },
                 {
                     title: 'Antigravity IDE',
                     task: async (subTask, subCtx) => {
                         subTask.skip('Antigravity IDE installer not configured. Please install manually.');
                     }
                 }
             ]);
         } else if (os.platform() === 'darwin') {
             return task.newListr([
                 {
                     title: 'VSCode',
                     task: async (subTask, subCtx) => {
                         subTask.output = 'Installing VSCode...';
                         await execa('brew', ['install', '--cask', 'visual-studio-code']);
                     }
                 },
                 {
                     title: 'Cursor',
                     task: async (subTask, subCtx) => {
                         subTask.output = 'Installing Cursor...';
                         await execa('brew', ['install', '--cask', 'cursor']);
                     }
                 },
                 {
                     title: 'Antigravity IDE',
                     task: async (subTask, subCtx) => {
                         subTask.skip('Antigravity IDE installer not configured. Please install manually.');
                     }
                 }
             ]);
         }
      }
    },
    {
      title: 'Setup Node.js Tools',
      task: async (ctx, task) => {
        task.output = 'Enabling corepack...';
        await execa('corepack', ['enable']);
      },
    },
  ]);

  try {
    await tasks.run();
    console.log(chalk.green('\n✅ Setup complete!'));
  } catch (e) {
    console.error(chalk.red('\n❌ Setup failed'));
    console.error(e);
    process.exit(1);
  }
});

program.parse();
