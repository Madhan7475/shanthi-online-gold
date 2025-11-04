#!/usr/bin/env node

/**
 * Setup .well-known files for App Deep Linking
 * - assetlinks.json for Android App Links
 * - apple-app-site-association for iOS Universal Links
 * Copies the appropriate files to the build output
 */

const fs = require('fs');
const path = require('path');

// Get the mode from command line arguments or environment variable
const mode = process.argv[2] || process.env.MODE || 'development';

// Target is the dist folder
const distDir = path.join(__dirname, '..', 'dist');
const wellKnownDir = path.join(distDir, '.well-known');

console.log(`\n🔗 Setting up deep linking files for ${mode} environment...`);

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error(`❌ Error: dist directory not found!`);
  console.log(`Build the project first with: npm run build`);
  process.exit(1);
}

// Create .well-known directory if it doesn't exist
if (!fs.existsSync(wellKnownDir)) {
  fs.mkdirSync(wellKnownDir, { recursive: true });
  console.log(`📁 Created: .well-known directory in dist`);
}

let hasError = false;

// Setup Android assetlinks.json
const assetlinksConfigDir = path.join(__dirname, '..', 'config', 'assetlinks');
const assetlinksSourceFile = path.join(assetlinksConfigDir, `assetlinks-${mode}.json`);
const assetlinksTargetFile = path.join(wellKnownDir, 'assetlinks.json');

if (!fs.existsSync(assetlinksSourceFile)) {
  console.error(`❌ Error: ${assetlinksSourceFile} not found!`);
  console.log(`\nExpected location: config/assetlinks/assetlinks-${mode}.json`);
  hasError = true;
} else {
  try {
    fs.copyFileSync(assetlinksSourceFile, assetlinksTargetFile);
    console.log(`✅ Android: Copied assetlinks-${mode}.json → assetlinks.json`);
  } catch (error) {
    console.error(`❌ Error copying assetlinks.json: ${error.message}`);
    hasError = true;
  }
}

// Setup iOS apple-app-site-association
const appleConfigDir = path.join(__dirname, '..', 'config', 'apple-app-site-association');
const appleSourceFile = path.join(appleConfigDir, `apple-app-site-association-${mode}.json`);
const appleTargetFile = path.join(wellKnownDir, 'apple-app-site-association');

if (!fs.existsSync(appleSourceFile)) {
  console.error(`❌ Error: ${appleSourceFile} not found!`);
  console.log(`\nExpected location: config/apple-app-site-association/apple-app-site-association-${mode}.json`);
  hasError = true;
} else {
  try {
    fs.copyFileSync(appleSourceFile, appleTargetFile);
    console.log(`✅ iOS: Copied apple-app-site-association-${mode}.json → apple-app-site-association`);
  } catch (error) {
    console.error(`❌ Error copying apple-app-site-association: ${error.message}`);
    hasError = true;
  }
}

if (hasError) {
  console.log(`\n⚠️  Some files were not copied. Please check the configuration files.`);
  process.exit(1);
}

console.log(`\n✨ Deep linking setup complete!`);
console.log(`📁 Location: ${wellKnownDir}\n`);
