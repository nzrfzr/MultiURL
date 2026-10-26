import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildTarget(target: 'chrome' | 'firefox') {
  console.log(`\n📦 Building MultiURL for target: ${target.toUpperCase()}...`);
  const outDir = path.join(rootDir, 'dist', target);

  // Clean output directory
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Build Popup UI
  console.log(`  -> Bundling Popup UI...`);
  await build({
    root: rootDir,
    configFile: false,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.join(rootDir, 'src'),
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: path.join(rootDir, 'popup.html'),
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  });

  // 2. Build Background Service Worker / Script
  console.log(`  -> Bundling Background Script...`);
  await build({
    root: rootDir,
    configFile: false,
    resolve: {
      alias: {
        '@': path.join(rootDir, 'src'),
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: path.join(rootDir, 'src', 'background', 'index.ts'),
        name: 'background',
        formats: [target === 'chrome' ? 'es' : 'iife'],
        fileName: () => 'background.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 3. Build Content Script (floating process widget)
  console.log(`  -> Bundling Content Script...`);
  await build({
    root: rootDir,
    configFile: false,
    resolve: {
      alias: {
        '@': path.join(rootDir, 'src'),
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: path.join(rootDir, 'src', 'content', 'process-popup.ts'),
        name: 'content',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 4. Copy Manifest
  console.log(`  -> Validating & copying manifest...`);
  const manifestPath = path.join(rootDir, 'manifests', `${target}.json`);
  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  if (!manifestContent.name || !manifestContent.version || !manifestContent.manifest_version) {
    throw new Error(`Invalid manifest for ${target}`);
  }
  
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifestContent, null, 2)
  );

  // 5. Copy Icons
  console.log(`  -> Copying icon assets...`);
  const iconsDir = path.join(outDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  const rawIconPath = path.join(rootDir, 'icon', 'icon.png');
  fs.copyFileSync(rawIconPath, path.join(iconsDir, 'icon-16.png'));
  fs.copyFileSync(rawIconPath, path.join(iconsDir, 'icon-48.png'));
  fs.copyFileSync(rawIconPath, path.join(iconsDir, 'icon-128.png'));

  console.log(`✅ Build for ${target.toUpperCase()} completed successfully! Output: dist/${target}/`);
}

async function run() {
  const startTime = Date.now();
  try {
    await buildTarget('chrome');
    await buildTarget('firefox');
    console.log(`\n🎉 All targets built successfully in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

run();
