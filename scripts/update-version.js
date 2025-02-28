import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Get message from command line args
const message = process.argv[2] || 'Version bump';

// Read current version from VERSION file
const versionFile = join(process.cwd(), 'VERSION');
const currentVersion = readFileSync(versionFile, 'utf8').trim();

// Parse version components
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Increment beta version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update VERSION file
writeFileSync(versionFile, newVersion);

// Update package.json
const packageFile = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageFile, 'utf8'));
packageJson.version = newVersion;
writeFileSync(packageFile, JSON.stringify(packageJson, null, 2) + '\n');

// Update CHANGELOG.md
const changelogFile = join(process.cwd(), 'CHANGELOG.md');
const changelog = readFileSync(changelogFile, 'utf8');
const today = new Date().toISOString().split('T')[0];

const newEntry = `## [${newVersion}] - ${today}\n\n### Changed\n- ${message}\n\n`;
const updatedChangelog = changelog.replace(/^/, newEntry);
writeFileSync(changelogFile, updatedChangelog);

// Update version.ts
const versionTsFile = join(process.cwd(), 'src', 'version.ts');
const versionTsContent = `// This file is auto-generated - do not edit manually
export const version = '${newVersion}';`;
writeFileSync(versionTsFile, versionTsContent);

console.log(`Version updated to ${newVersion}`);