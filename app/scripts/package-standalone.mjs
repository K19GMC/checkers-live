import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('.next/standalone', 'dist', { recursive: true });
cpSync('.next/static', 'dist/.next/static', { recursive: true });
copyFileSync('.next/standalone/server.js', 'dist/boot.js');
