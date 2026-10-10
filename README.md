# Did Not Get It

"Did Not Get It" is a cross-browser extension for Firefox and Chrome that automatically identifies, labels, and marks Gmail rejection emails as read while maintaining a local "rejections skipped" counter.

Developed by [Kuvware](https://kuvware.com).

## Source Code Submission Requirements

For those who wish to replicate locally, I included step-by-step build instructions, required program versions, installation instructions, and operating system requirements to create an exact copy of the add-on code.

## System & Environment Requirements

To build and package this extension from source, your environment must meet the following requirements:

- **Operating System:** Cross-platform (Linux, macOS, or Windows)
- **Node.js:** Version 18.x or higher (LTS recommended). Download and install from [nodejs.org](https://nodejs.org/).
- **npm:** Version 9.x or higher (comes bundled with Node.js).

## Technology Stack

- **Framework/Bundler:** [WXT](https://wxt.dev/) (Web Extension Tools)
- **Language:** Vanilla TypeScript
- **APIs:** Gmail REST API via OAuth 2.0 (`browser.identity.launchWebAuthFlow`), Chrome/Firefox Extension Manifest V3 APIs.

## Step-by-Step Build Instructions

Follow these steps to set up the development environment and generate an exact copy of the production add-on package.

### 1. Install Dependencies

Open your terminal in the root project directory and install the required project dependencies:

```bash
npm install
```

### 2. Configure Environment Variables

If your OAuth Client ID is not hardcoded, create a `.env` file in the root directory and configure it:

```env
WXT_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### 3. Build for Production

Execute the following build scripts to trigger all necessary technical steps to bundle and compile the production package.

**Build for Firefox:**

```bash
npx wxt build -b firefox
```

**Build for Chrome:**

```bash
npx wxt build -b chrome
```

Once the build completes successfully, the final production-ready submission `.zip` archives will be located inside the `.output/` directory. These archives are ready to be uploaded to the respective developer dashboards.
