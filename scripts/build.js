import { execSync } from 'child_process';
import { mkdirSync, cpSync, existsSync, rmSync } from 'fs';

const installCmd = process.env.NETLIFY ? 'npm ci' : 'npm install';

console.log('Building Youth Portal...');
execSync(`cd Ember-Youth-Portal && ${installCmd} && npm run build`, { stdio: 'inherit' });

console.log('Building Leader Portal...');
execSync(`cd Ember-Youth-Leader-Portal && ${installCmd} && npm run build`, { stdio: 'inherit' });

console.log('Combining into dist/...');
if (existsSync('dist')) rmSync('dist', { recursive: true });
mkdirSync('dist/leader', { recursive: true });

cpSync('Ember-Youth-Portal/dist', 'dist', { recursive: true });
cpSync('Ember-Youth-Leader-Portal/dist', 'dist/leader', { recursive: true });

console.log('Build complete!');
