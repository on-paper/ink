#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args[0]?.toLowerCase();
const fromCommit = args[1];
const toCommit = args[2] || 'HEAD';

// Validate version type
if (!versionType || !['major', 'minor', 'patch', 'fix'].includes(versionType)) {
  console.error('❌ Invalid version type');
  console.error('Usage: release <major|minor|patch|fix> [from-commit] [to-commit]');
  console.error('Examples:');
  console.error('  release patch                    # All recent commits');
  console.error('  release minor abc123 HEAD        # From commit abc123 to HEAD');
  console.error('  release major HEAD~20 HEAD       # Last 20 commits');
  process.exit(1);
}

// Handle 'fix' as an alias for 'patch'
const actualVersionType = versionType === 'fix' ? 'patch' : versionType;

// Read current package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Parse current version (handle both "1.0" and "1.0.0" formats)
const currentVersion = packageJson.version || '0.0.0';
const versionParts = currentVersion.split('.');
const major = parseInt(versionParts[0] || '0');
const minor = parseInt(versionParts[1] || '0');
const patch = parseInt(versionParts[2] || '0');

// Calculate new version
let newMajor = major;
let newMinor = minor;
let newPatch = patch;

switch (actualVersionType) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    break;
  case 'patch':
    newPatch++;
    break;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

console.log(`\n🚀 Creating Release`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Current version: ${currentVersion}`);
console.log(`  New version:     ${newVersion}`);
console.log(`  Type:            ${actualVersionType}`);

// Determine commit range
let commitRange = '';
let recentCommits = [];

try {
  if (fromCommit) {
    // Use specified commit range
    commitRange = `${fromCommit}..${toCommit}`;
    console.log(`  Commit range:    ${commitRange}`);
  } else {
    // Try to find last tag, or use last 50 commits
    try {
      const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf8' }).trim();
      commitRange = `${lastTag}..HEAD`;
      console.log(`  Commits since:   ${lastTag}`);
    } catch {
      commitRange = 'HEAD~50..HEAD';
      console.log(`  Commits:         Last 50`);
    }
  }

  // Fetch commits in range
  const gitLog = execSync(
    `git log ${commitRange} --pretty=format:"%H|%s|%an|%ad" --date=short`,
    { encoding: 'utf8' }
  );
  
  if (gitLog) {
    recentCommits = gitLog.split('\n').filter(Boolean).map(line => {
      const [hash, message, author, date] = line.split('|');
      return { 
        hash: hash.substring(0, 7), 
        message: message.trim(), 
        author, 
        date 
      };
    });
  }
} catch (error) {
  console.warn('⚠️  Could not fetch git commits:', error.message);
}

console.log(`  Total commits:   ${recentCommits.length}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// Categorize commits
const features = [];
const fixes = [];
const breaking = [];
const other = [];

recentCommits.forEach(commit => {
  const msg = commit.message.toLowerCase();
  const originalMsg = commit.message;
  
  if (msg.startsWith('breaking:') || msg.startsWith('!:') || msg.includes('breaking change')) {
    breaking.push(originalMsg);
  } else if (msg.startsWith('feat:') || msg.startsWith('feature:') || msg.includes('add ') || msg.includes('implement')) {
    features.push(originalMsg);
  } else if (msg.startsWith('fix:') || msg.includes('fix ') || msg.includes('fixed ') || msg.includes('fixes ')) {
    fixes.push(originalMsg);
  } else {
    other.push(originalMsg);
  }
});

console.log('📊 Commit Analysis:');
console.log(`  ✨ Features:        ${features.length}`);
console.log(`  🐛 Fixes:           ${fixes.length}`);
console.log(`  ⚠️  Breaking:        ${breaking.length}`);
console.log(`  📝 Other:           ${other.length}`);
console.log('');

// Update changelog.json
console.log('📋 Updating changelog...');
const changelogPath = path.join(process.cwd(), 'public', 'changelog.json');
let changelog = { entries: [] };

if (fs.existsSync(changelogPath)) {
  try {
    changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
  } catch (error) {
    console.warn('⚠️  Could not parse existing changelog.json, starting fresh');
  }
}

// Generate description based on changes
function generateDescription(type, features, fixes, breaking) {
  if (breaking.length > 0) {
    return `Major release with breaking changes. Please review the breaking changes section carefully before upgrading.`;
  }
  
  const parts = [];
  if (features.length > 0) parts.push(`${features.length} new features`);
  if (fixes.length > 0) parts.push(`${fixes.length} bug fixes`);
  
  if (parts.length === 0) {
    return `Maintenance release with various improvements.`;
  }
  
  switch (type) {
    case 'major':
      return `Major release with ${parts.join(' and ')}.`;
    case 'minor':
      return `New features and improvements including ${parts.join(' and ')}.`;
    case 'patch':
      return `Bug fixes and improvements including ${parts.join(' and ')}.`;
    default:
      return `Release includes ${parts.join(' and ')}.`;
  }
}

// Create new changelog entry
const newEntry = {
  id: `v${newVersion}`,
  title: `Version ${newVersion}`,
  description: generateDescription(actualVersionType, features, fixes, breaking),
  fromCommit: recentCommits[recentCommits.length - 1]?.hash || 'unknown',
  toCommit: recentCommits[0]?.hash || 'HEAD',
  date: new Date().toISOString().split('T')[0],
};

// Add categorized commits if they exist
if (features.length > 0) newEntry.features = features;
if (fixes.length > 0) newEntry.fixes = fixes;
if (breaking.length > 0) newEntry.breaking = breaking;

// Add new entry to the beginning
changelog.entries.unshift(newEntry);

// Keep only last 20 entries to prevent file from growing too large
changelog.entries = changelog.entries.slice(0, 20);

// Write updated changelog
fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
console.log('✅ Updated public/changelog.json');

// Update package.json version
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ Updated package.json version');

// Check for uncommitted changes
let hasUncommittedChanges = false;
try {
  execSync('git diff --quiet HEAD', { stdio: 'pipe' });
} catch {
  hasUncommittedChanges = true;
}

if (hasUncommittedChanges) {
  console.log('\n⚠️  You have uncommitted changes. Please commit or stash them first.');
  console.log('\nSuggested commands:');
  console.log(`  git add -A`);
  console.log(`  git commit -m "release: v${newVersion}"`);
  console.log(`  git tag v${newVersion}`);
  console.log(`  git push origin main --tags`);
} else {
  // Auto-commit and tag
  console.log('\n🏷️  Creating git commit and tag...');
  
  try {
    // Stage the changes
    execSync('git add package.json public/changelog.json', { stdio: 'pipe' });
    
    // Create commit
    const commitMessage = `release: v${newVersion}\n\n${newEntry.description}`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
    console.log(`✅ Created commit for v${newVersion}`);
    
    // Create tag
    execSync(`git tag -a v${newVersion} -m "Release ${newVersion}"`, { stdio: 'pipe' });
    console.log(`✅ Created tag v${newVersion}`);
    
    console.log('\n✨ Release prepared successfully!');
    console.log('\nTo publish the release:');
    console.log(`  git push origin main`);
    console.log(`  git push origin v${newVersion}`);
    console.log('\nOr push everything at once:');
    console.log(`  git push origin main --tags`);
  } catch (error) {
    console.error('\n❌ Error during git operations:', error.message);
    console.log('\nYou can manually run:');
    console.log(`  git add -A`);
    console.log(`  git commit -m "release: v${newVersion}"`);
    console.log(`  git tag v${newVersion}`);
    console.log(`  git push origin main --tags`);
  }
}

console.log('\n📦 Release Summary:');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Version:     ${newVersion}`);
console.log(`  Commits:     ${recentCommits.length}`);
console.log(`  Features:    ${features.length}`);
console.log(`  Fixes:       ${fixes.length}`);
if (breaking.length > 0) {
  console.log(`  ⚠️  Breaking:  ${breaking.length} (Review carefully!)`);
}
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);