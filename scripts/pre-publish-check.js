#!/usr/bin/env node

/**
 * Pre-publish Check Script for Watsch
 *
 * This script verifies the application's functionality, security,
 * and build process before publication to GitHub.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configuration
const ENV_FILE = '.env';
const ENV_EXAMPLE_FILE = '.env.example';
const REQUIRED_ENV_VARS = [
	'TMDB_API_KEY',
	'OPENAI_API_KEY',
	'KV_REST_API_READ_ONLY_TOKEN',
	'YOUTUBE_API_KEY',
	'RAPID_API_KEY',
	'PRIVATE_DEEPSEEK_API_KEY',
	'OMDB_API_KEY',
	'TMDB_ACCESS_TOKEN',
	'AUTH0_DOMAIN',
	'AUTH0_CLIENT_ID',
	'AUTH0_CLIENT_SECRET'
];

// ASCII art logo
console.log(
	chalk.red(`
██╗    ██╗ █████╗ ████████╗███████╗ ██████╗██╗  ██╗
██║    ██║██╔══██╗╚══██╔══╝██╔════╝██╔════╝██║  ██║
██║ █╗ ██║███████║   ██║   ███████╗██║     ███████║
██║███╗██║██╔══██║   ██║   ╚════██║██║     ██╔══██║
╚███╔███╔╝██║  ██║   ██║   ███████║╚██████╗██║  ██║
 ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝
                                                   
`)
);
console.log(chalk.yellow('🚀 Pre-publish Check Script 🚀\n'));

// Helper functions
function runCommand(command, errorMessage) {
	try {
		console.log(chalk.gray(`Running: ${command}`));
		const output = execSync(command, { encoding: 'utf8' });
		return { success: true, output };
	} catch (error) {
		console.error(chalk.red(`❌ ${errorMessage}`));
		console.error(chalk.gray(error.message));
		return { success: false, error };
	}
}

function checkFileExists(filePath, description) {
	const exists = fs.existsSync(filePath);
	if (exists) {
		console.log(chalk.green(`✅ ${description} exists`));
	} else {
		console.log(chalk.red(`❌ ${description} is missing`));
	}
	return exists;
}

// Main check functions
function checkDependencies() {
	console.log(chalk.blue('\n🔍 Checking dependencies...\n'));

	const result = runCommand('npm ls --depth=0', 'Failed to list dependencies');
	if (result.success) {
		console.log(chalk.green('✅ Dependencies check passed'));
	}

	const outdatedResult = runCommand(
		'npm outdated --depth=0',
		'Failed to check outdated dependencies'
	);
	if (outdatedResult.success) {
		if (outdatedResult.output.trim() === '') {
			console.log(chalk.green('✅ All dependencies are up to date'));
		} else {
			console.log(chalk.yellow('⚠️ Some dependencies could be updated:'));
			console.log(outdatedResult.output);
		}
	}

	// Check for duplicate dependencies
	const duplicateResult = runCommand('npx depcheck', 'Failed to check for duplicate dependencies');
	if (duplicateResult.success) {
		console.log(chalk.green('✅ Dependency check completed'));
	}
}

function checkEnvironmentVariables() {
	console.log(chalk.blue('\n🔍 Checking environment variables...\n'));

	const envFileExists = checkFileExists(ENV_FILE, '.env file');
	const envExampleExists = checkFileExists(ENV_EXAMPLE_FILE, '.env.example file');

	if (envFileExists) {
		const envContent = fs.readFileSync(ENV_FILE, 'utf8');
		const missingVars = [];

		REQUIRED_ENV_VARS.forEach((envVar) => {
			if (!envContent.includes(`${envVar}=`)) {
				missingVars.push(envVar);
			}
		});

		if (missingVars.length === 0) {
			console.log(chalk.green('✅ All required environment variables are set'));
		} else {
			console.log(
				chalk.red(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
			);
		}
	}

	if (envExampleExists) {
		const envExampleContent = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf8');
		const missingVars = [];

		REQUIRED_ENV_VARS.forEach((envVar) => {
			if (!envExampleContent.includes(`${envVar}=`)) {
				missingVars.push(envVar);
			}
		});

		if (missingVars.length === 0) {
			console.log(chalk.green('✅ .env.example includes all required variables'));
		} else {
			console.log(chalk.yellow(`⚠️ .env.example is missing variables: ${missingVars.join(', ')}`));
		}

		// Check for real API keys in .env.example (security risk)
		const apiKeyPatterns = [
			/sk-[a-zA-Z0-9]{48}/, // OpenAI key pattern
			/[a-f0-9]{32}/, // Common API key pattern
			/[A-Za-z0-9_]{30,40}/ // Another common API key pattern
		];

		let containsRealKeys = false;
		apiKeyPatterns.forEach((pattern) => {
			if (pattern.test(envExampleContent)) {
				containsRealKeys = true;
			}
		});

		if (containsRealKeys) {
			console.log(
				chalk.red(
					'⚠️ WARNING: .env.example might contain real API keys. Replace them with placeholders!'
				)
			);
		} else {
			console.log(chalk.green('✅ No real API keys detected in .env.example'));
		}
	}
}

function runLinting() {
	console.log(chalk.blue('\n🔍 Running linting checks...\n'));

	const lintResult = runCommand('npm run lint', 'Linting failed');
	if (lintResult.success) {
		console.log(chalk.green('✅ Linting passed'));
	}
}

function runTypeCheck() {
	console.log(chalk.blue('\n🔍 Running TypeScript type checks...\n'));

	const typeCheckResult = runCommand('npm run check', 'TypeScript check failed');
	if (typeCheckResult.success) {
		console.log(chalk.green('✅ TypeScript check passed'));
	}
}

function runBuild() {
	console.log(chalk.blue('\n🔍 Testing production build...\n'));

	const buildResult = runCommand('npm run build', 'Build failed');
	if (buildResult.success) {
		console.log(chalk.green('✅ Production build successful'));
	}
}

function checkSecurityVulnerabilities() {
	console.log(chalk.blue('\n🔍 Checking for security vulnerabilities...\n'));

	const auditResult = runCommand('npm audit', 'Security audit failed');
	if (auditResult.success) {
		if (auditResult.output.includes('found 0 vulnerabilities')) {
			console.log(chalk.green('✅ No security vulnerabilities found'));
		} else {
			console.log(chalk.yellow('⚠️ Security vulnerabilities detected:'));
			console.log(auditResult.output);
		}
	}
}

function checkGitHubReadiness() {
	console.log(chalk.blue('\n🔍 Checking GitHub readiness...\n'));

	// Check for README
	checkFileExists('README.md', 'README.md file');

	// Check for LICENSE
	checkFileExists('LICENSE', 'LICENSE file');

	// Check for .gitignore
	const gitignoreExists = checkFileExists('.gitignore', '.gitignore file');

	if (gitignoreExists) {
		const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
		const requiredEntries = [
			'node_modules',
			'.env',
			'.DS_Store',
			'build',
			'.svelte-kit',
			'.vercel'
		];

		const missingEntries = [];
		requiredEntries.forEach((entry) => {
			if (!gitignoreContent.includes(entry)) {
				missingEntries.push(entry);
			}
		});

		if (missingEntries.length === 0) {
			console.log(chalk.green('✅ .gitignore contains all required entries'));
		} else {
			console.log(chalk.yellow(`⚠️ .gitignore is missing entries: ${missingEntries.join(', ')}`));
		}
	}

	// Check for uncommitted changes
	const statusResult = runCommand('git status --porcelain', 'Failed to check git status');
	if (statusResult.success) {
		if (statusResult.output.trim() === '') {
			console.log(chalk.green('✅ No uncommitted changes'));
		} else {
			console.log(chalk.yellow('⚠️ You have uncommitted changes:'));
			console.log(statusResult.output);
		}
	}

	// Check for consistent file naming conventions
	console.log(chalk.blue('\n🔍 Checking file naming consistency...\n'));
	const sourceFiles = runCommand(
		'find src -type f -name "*.svelte" -o -name "*.ts" -o -name "*.js"',
		'Failed to list source files'
	);

	if (sourceFiles.success) {
		const fileNames = sourceFiles.output.split('\n').filter(Boolean);
		const kebabCaseFiles = fileNames.filter((file) => {
			const basename = path.basename(file, path.extname(file));
			return (
				basename.includes('-') && !basename.includes('_') && basename === basename.toLowerCase()
			);
		});

		const pascalCaseFiles = fileNames.filter((file) => {
			const basename = path.basename(file, path.extname(file));
			return /^[A-Z][a-zA-Z0-9]*$/.test(basename);
		});

		const camelCaseFiles = fileNames.filter((file) => {
			const basename = path.basename(file, path.extname(file));
			return (
				/^[a-z][a-zA-Z0-9]*$/.test(basename) && !basename.includes('-') && !basename.includes('_')
			);
		});

		if (kebabCaseFiles.length > 0 && pascalCaseFiles.length > 0 && camelCaseFiles.length > 0) {
			console.log(
				chalk.yellow(
					'⚠️ Mixed file naming conventions detected (kebab-case, PascalCase, and camelCase)'
				)
			);
		} else {
			console.log(chalk.green('✅ Consistent file naming convention used'));
		}
	}
}

function checkAssetOptimization() {
	console.log(chalk.blue('\n🔍 Checking asset optimization...\n'));

	// Check image file sizes
	const imageResult = runCommand(
		'find static -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" | xargs du -h',
		'Failed to list image files'
	);

	if (imageResult.success) {
		const imageOutput = imageResult.output.trim();
		if (imageOutput) {
			console.log(chalk.yellow('ℹ️ Image files sizes (consider optimizing large images):'));

			const imageLines = imageOutput.split('\n');
			let largeImagesFound = false;

			imageLines.forEach((line) => {
				const [size, file] = line.split('\t');
				const sizeInKB = parseFloat(size);

				if (size.includes('M') || (size.includes('K') && parseFloat(size) > 500)) {
					console.log(chalk.yellow(`  - ${file}: ${size} (consider optimizing)`));
					largeImagesFound = true;
				}
			});

			if (!largeImagesFound) {
				console.log(chalk.green('✅ No overly large images found'));
			}
		} else {
			console.log(chalk.green('✅ No image files found to check'));
		}
	}
}

function checkCodeDuplication() {
	console.log(chalk.blue('\n🔍 Checking for code duplication...\n'));

	// This is a simple check; for more sophisticated duplication detection,
	// consider installing tools like jscpd

	// Check for duplicate file names
	const duplicateNameResult = runCommand(
		'find src -type f -name "*.svelte" -o -name "*.ts" -o -name "*.js" | xargs -n1 basename | sort | uniq -d',
		'Failed to check for duplicate file names'
	);

	if (duplicateNameResult.success) {
		if (duplicateNameResult.output.trim() === '') {
			console.log(chalk.green('✅ No duplicate file names found'));
		} else {
			console.log(chalk.yellow('⚠️ Duplicate file names detected (could cause confusion):'));
			console.log(duplicateNameResult.output);
		}
	}

	// Check for duplicate configuration files
	const configFiles = [
		'tailwind.config.js',
		'tailwind.config.cjs',
		'postcss.config.js',
		'postcss.config.cjs'
	];
	const duplicateConfigFiles = [];

	configFiles.forEach((file) => {
		if (fs.existsSync(file)) {
			const ext = path.extname(file);
			const basename = path.basename(file, ext);

			configFiles.forEach((otherFile) => {
				if (file !== otherFile && path.basename(otherFile, path.extname(otherFile)) === basename) {
					if (fs.existsSync(otherFile)) {
						duplicateConfigFiles.push(`${file} and ${otherFile}`);
					}
				}
			});
		}
	});

	if (duplicateConfigFiles.length === 0) {
		console.log(chalk.green('✅ No duplicate configuration files found'));
	} else {
		console.log(chalk.yellow('⚠️ Duplicate configuration files detected:'));
		duplicateConfigFiles.forEach((pair) => {
			console.log(`  - ${pair}`);
		});
	}
}

function checkCrossCompatibility() {
	console.log(chalk.blue('\n🔍 Checking cross-compatibility issues...\n'));

	// Check for modern JavaScript features without polyfills
	const modernJSFeatures = [
		{ name: 'Optional chaining (?.) without fallback', pattern: /[a-zA-Z0-9_\.]+\?\./ },
		{ name: 'Nullish coalescing operator (??)', pattern: /\?\?/ }
	];

	const sourcesResult = runCommand(
		'find src -type f -name "*.js" -o -name "*.ts" -o -name "*.svelte" | xargs cat',
		'Failed to read source files'
	);

	if (sourcesResult.success) {
		let foundModernFeatures = false;

		modernJSFeatures.forEach((feature) => {
			if (feature.pattern.test(sourcesResult.output)) {
				console.log(chalk.yellow(`⚠️ Modern JavaScript feature found: ${feature.name}`));
				foundModernFeatures = true;
			}
		});

		if (!foundModernFeatures) {
			console.log(chalk.green('✅ No problematic modern JavaScript features detected'));
		} else {
			console.log(chalk.yellow('  Consider browser compatibility or ensure proper polyfills'));
		}
	}

	// Check package.json for browser targets
	const pkgContent = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	if (!pkgContent.browserslist) {
		console.log(chalk.yellow('⚠️ No browserslist configuration found in package.json'));
		console.log(
			chalk.yellow('  Consider adding browserslist to ensure proper cross-browser compatibility')
		);
	} else {
		console.log(chalk.green('✅ Browserslist configuration found'));
	}
}

// Run all checks
async function runAllChecks() {
	try {
		checkDependencies();
		checkEnvironmentVariables();
		runLinting();
		runTypeCheck();
		runBuild();
		checkSecurityVulnerabilities();
		checkGitHubReadiness();
		checkAssetOptimization();
		checkCodeDuplication();
		checkCrossCompatibility();

		console.log(chalk.green('\n✨ Pre-publish check completed! ✨\n'));
	} catch (error) {
		console.error(chalk.red('\n❌ Pre-publish check failed!'));
		console.error(error);
		process.exit(1);
	}
}

runAllChecks();
