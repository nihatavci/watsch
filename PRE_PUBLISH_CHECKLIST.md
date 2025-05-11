# Watsch Project Pre-Publish Checklist

Welcome to the Watsch Pre-Publish Checklist! This document is designed to help you ensure the project is ready for release by covering all critical areas: environment setup, code quality, security, functionality, documentation, GitHub readiness, and final pre-publish steps. Use this checklist before every major release to maintain high standards and a smooth developer experience.

---

## How to Use This Checklist

1. **Before every major release or deployment**, open this checklist and work through each section.
2. **Check off** each item as you verify it is complete. For collaborative releases, assign sections to team members as needed.
3. If you find a checklist item that is unclear or not applicable, leave a comment or suggest an update.
4. For any item that cannot be completed, document the reason and notify the team before proceeding with the release.
5. After all items are checked, proceed with the release process and monitor for any issues post-deployment.

---

## Checklist Overview

- [ ] **Environment Setup and Configuration**
- [ ] **Code Quality and Standards**
- [ ] **Security Audit**
- [ ] **Functionality Verification**
- [ ] **Documentation Review**
- [ ] **GitHub Readiness**
- [ ] **Final Pre-publish Checklist**

Each section below contains detailed checks to guide you through the release process.

---

## 1. Environment Setup and Configuration

- [ ] All required environment variables are set in `.env`

  - [ ] TMDB_API_KEY
  - [ ] OPENAI_API_KEY
  - [ ] KV_REST_API_READ_ONLY_TOKEN
  - [ ] YOUTUBE_API_KEY
  - [ ] RAPID_API_KEY
  - [ ] PRIVATE_DEEPSEEK_API_KEY
  - [ ] OMDB_API_KEY
  - [ ] TMDB_ACCESS_TOKEN
  - [ ] AUTH0_DOMAIN
  - [ ] AUTH0_CLIENT_ID
  - [ ] AUTH0_CLIENT_SECRET

- [ ] `.env.example` file is updated with placeholders (not real keys)
- [ ] Verified that no API keys or sensitive data are committed to the repository

## 2. Code Quality and Standards

- [ ] All linting errors are resolved

  ```bash
  npm run lint
  ```

- [ ] TypeScript type checking passes

  ```bash
  npm run check
  ```

- [ ] Build process completes successfully

  ```bash
  npm run build
  ```

- [ ] No console.log statements left in production code
- [ ] Code is properly formatted

  ```bash
  npm run format
  ```

- [ ] File naming conventions are consistent across the codebase
- [ ] Duplicate configuration files are consolidated (check tailwind.config.js/cjs, postcss.config.js/cjs)

## 3. Security Audit

- [ ] No security vulnerabilities in dependencies

  ```bash
  npm audit
  ```

- [ ] API keys are not hardcoded anywhere in the codebase
- [ ] Authentication flows are properly implemented and tested
- [ ] Environment variables are properly sanitized and validated
- [ ] Cross-site scripting (XSS) protection is implemented

## 4. Functionality Verification

- [ ] Core features have been manually tested:

  - [ ] User registration and login
  - [ ] Movie recommendations
  - [ ] Movie details display
  - [ ] Movie night functionality
  - [ ] Streaming availability checking
  - [ ] Short video content
  - [ ] Settings pages
  - [ ] Navigation and routing

- [ ] Application works on mobile devices
- [ ] Application works on different browsers (Chrome, Firefox, Safari)
- [ ] No broken links or 404 errors
- [ ] API endpoints return expected responses

## 5. Documentation Review

- [ ] README.md is updated with:

  - [ ] Project description
  - [ ] Installation instructions
  - [ ] Usage guide
  - [ ] API documentation (if applicable)
  - [ ] Contributing guidelines

- [ ] Inline code comments are clear and useful
- [ ] CHANGELOG.md is updated with the latest changes
- [ ] PROJECT_SCOPE.md is updated with any architectural changes

## 6. GitHub Readiness

- [ ] `.gitignore` includes all necessary patterns:

  - [ ] node_modules
  - [ ] .env
  - [ ] .DS_Store
  - [ ] build
  - [ ] .svelte-kit
  - [ ] .vercel

- [ ] LICENSE file is present
- [ ] All changes are committed (`git status` is clean)
- [ ] Branch is up to date with the main branch
- [ ] Pull request template is filled out (if applicable)
- [ ] Issue template is present (if applicable)
- [ ] Check that `.github/` directory contains PR and issue templates as needed

## 7. Final Pre-publish Checklist

- [ ] Run the automated pre-publish check script (ensure this script exists in `package.json`)
  ```bash
  npm run pre-publish-check
  ```
