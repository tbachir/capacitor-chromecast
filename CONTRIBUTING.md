# Contributing

This guide provides instructions for contributing to this Capacitor plugin.

## Developing

### Local Setup

1. Fork and clone the repo.
1. Install the dependencies.

    ```shell
    npm install
    ```

1. Install SwiftLint if you're on macOS.

    ```shell
    brew install swiftlint
    ```

### Scripts

#### `npm run build`

Build the plugin web assets and generate plugin API documentation using [`@capacitor/docgen`](https://github.com/ionic-team/capacitor-docgen).

It will compile the TypeScript code from `src/` into ESM JavaScript in `dist/esm/`. These files are used in apps with bundlers when your plugin is imported.

Then, Rollup will bundle the code into a single file at `dist/plugin.js`. This file is used in apps without bundlers by including it as a script in `index.html`.

#### `npm run verify`

Build and validate the web and native projects.

This is useful to run in CI to verify that the plugin builds for all platforms.

#### `npm run test:contract`

Validate the plugin API contract across:
- `src/definitions.ts`
- iOS native method exports (`ChromecastPlugin.swift` and `ChromecastPlugin.m`)
- Android native method exports (`Chromecast.java`)

This catches API drift (missing methods, extra methods, or wrong Capacitor method return types).

#### `npm run lint` / `npm run fmt`

Check formatting and code quality, autoformat/autofix if possible.

This template is integrated with ESLint, Prettier, and SwiftLint. Using these tools is completely optional, but the [Capacitor Community](https://github.com/capacitor-community/) strives to have consistent code style and structure for easier cooperation.

## Publishing

Use this checklist before publishing a new version:

1. Make sure you are authenticated with npm and have publish rights for the package scope.

    ```shell
    npm whoami
    ```

1. Bump the version in a controlled way.

    ```shell
    npm version patch
    # or: npm version minor / npm version major
    ```

1. Validate and build the package.

    ```shell
    npm ci
    npm run build
    npm run eslint
    npm pack --dry-run
    ```

1. Publish the scoped package as public.

    ```shell
    npm publish --access public
    ```

> **Note**: `prepublishOnly` in `package.json` runs `npm run build` automatically on publish.
> **Note**: The [`files`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files) array in `package.json` controls what is included in the npm tarball. If you rename files/directories or add files elsewhere, update this list.
