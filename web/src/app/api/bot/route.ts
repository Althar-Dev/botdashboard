import { NextResponse } from 'next/server';
import path from 'path';

// Store bot process globally across HMR reloads
declare global {
  var botChildProcess: any | null;
}

if (globalThis.botChildProcess === undefined) {
  globalThis.botChildProcess = null;
}

const isProcessAlive = (proc: any | null) => {
  return !!(proc && !proc.killed && proc.exitCode === null);
};

// Dynamic spawn helper to bypass Turbopack static AST module resolution
const dynamicSpawn = (cmd: string, args: string[], options: any) => {
  const spawnFn = new Function(
    'cmd',
    'args',
    'opts',
    'return require("child_process").spawn(cmd, args, opts)'
  );
  return spawnFn(cmd, args, options);
};

export async function GET() {
  const alive = isProcessAlive(globalThis.botChildProcess);
  return NextResponse.json({
    success: true,
    isRunning: alive,
    pid: alive ? globalThis.botChildProcess?.pid : null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'toggle';

    const rootDir = path.resolve(process.cwd(), '..');
    const scriptFile = ['index', 'js'].join('.');

    if (action === 'start') {
      if (isProcessAlive(globalThis.botChildProcess)) {
        return NextResponse.json({
          success: true,
          isRunning: true,
          message: 'Bot is already running!',
        });
      }

      // Spawn real bot process dynamically
      const child = dynamicSpawn('node', [scriptFile], {
        cwd: rootDir,
        stdio: 'ignore',
        detached: false,
      });

      child.on('error', (err: any) => {
        console.error('Failed to start bot process:', err);
        globalThis.botChildProcess = null;
      });

      child.on('exit', (code: any) => {
        console.log(`Bot process exited with code ${code}`);
        globalThis.botChildProcess = null;
      });

      globalThis.botChildProcess = child;

      return NextResponse.json({
        success: true,
        isRunning: true,
        pid: child.pid,
        message: 'Telegram Bot launched successfully!',
      });
    }

    if (action === 'stop') {
      if (globalThis.botChildProcess && isProcessAlive(globalThis.botChildProcess)) {
        try {
          if (process.platform === 'win32' && globalThis.botChildProcess.pid) {
            dynamicSpawn('taskkill', ['/pid', globalThis.botChildProcess.pid.toString(), '/f', '/t'], {});
          } else {
            globalThis.botChildProcess.kill('SIGTERM');
          }
        } catch (e) {
          console.error('Error killing process:', e);
        }
        globalThis.botChildProcess = null;
      }

      return NextResponse.json({
        success: true,
        isRunning: false,
        message: 'Telegram Bot stopped!',
      });
    }

    if (action === 'toggle') {
      const currentlyAlive = isProcessAlive(globalThis.botChildProcess);
      if (currentlyAlive) {
        // Stop it
        if (globalThis.botChildProcess) {
          try {
            if (process.platform === 'win32' && globalThis.botChildProcess.pid) {
              dynamicSpawn('taskkill', ['/pid', globalThis.botChildProcess.pid.toString(), '/f', '/t'], {});
            } else {
              globalThis.botChildProcess.kill('SIGTERM');
            }
          } catch (e) {}
          globalThis.botChildProcess = null;
        }
        return NextResponse.json({
          success: true,
          isRunning: false,
          message: 'Telegram Bot stopped!',
        });
      } else {
        // Start it
        const child = dynamicSpawn('node', [scriptFile], {
          cwd: rootDir,
          stdio: 'ignore',
          detached: false,
        });

        child.on('error', () => {
          globalThis.botChildProcess = null;
        });

        child.on('exit', () => {
          globalThis.botChildProcess = null;
        });

        globalThis.botChildProcess = child;

        return NextResponse.json({
          success: true,
          isRunning: true,
          pid: child.pid,
          message: 'Telegram Bot launched successfully!',
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to control bot process' },
      { status: 500 }
    );
  }
}
