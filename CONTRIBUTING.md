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

This project has two contribution scenarios:

1. Maintainer or contributor with npm publish rights on `@strasberry/capacitor-chromecast`
1. Contributor without npm publish rights

### Scenario A: Maintainer release flow (has npm publish rights)

Use this end-to-end checklist for a production release.

1. Start from the canonical repository and an up-to-date main branch.

    ```shell
    git checkout master
    git pull --ff-only
    ```

1. Verify npm authentication and package permissions.

    ```shell
    npm whoami
    npm owner ls @strasberry/capacitor-chromecast
    ```

1. Run quality gates before bumping the version.

    ```shell
    npm ci
    npm run eslint
    npm run test:contract
    npm run test:web
    npm run build
    npm pack --dry-run
    ```

1. Bump the version.

    ```shell
    npm version patch --no-git-tag-version
    # or: npm version minor --no-git-tag-version
    # or: npm version major --no-git-tag-version
    ```

1. Rebuild after bump (ensures generated artifacts match the new version).

    ```shell
    npm run build
    ```

1. Commit all intended release changes.

    ```shell
    git add -A
    git commit -m "chore(release): vX.Y.Z"
    ```

1. Create and push the release tag.

    ```shell
    git tag -a vX.Y.Z -m "Release vX.Y.Z"
    git push origin master
    git push origin vX.Y.Z
    ```

1. Publish to npm.

    ```shell
    npm publish --access public
    ```

### Scenario B: Contributor without npm publish rights

Contributors without package access should not publish directly.

1. Open a PR with code changes and release notes.
1. If the PR changes public API, call it out explicitly.
1. Maintainer performs version bump, tag, and npm publish after merge.

### Scenario C: Contributor with npm publish rights

If a contributor is granted publish rights by maintainers, use Scenario A exactly from the canonical repository, not from a personal fork.

## npm Auth and permission troubleshooting

Common publish failures and fixes:

- `E401 Unauthorized` or `Access token expired or revoked`
  - Re-authenticate:

    ```shell
    npm login --scope=@strasberry --registry=https://registry.npmjs.org
    npm whoami
    ```

- `E404 Not Found` while publishing scoped package
  - Usually means missing permission for the scope/package or wrong registry.
  - Verify:

    ```shell
    npm config get registry
    npm owner ls @strasberry/capacitor-chromecast
    ```

- 2FA required for publish
  - Use an npm account/token configured for publish with your organization 2FA policy.

> **Note**: `prepublishOnly` in `package.json` runs `npm run build` automatically during `npm publish`.
> **Note**: The [`files`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files) array in `package.json` controls what is included in the npm tarball. If you rename files/directories or add files elsewhere, update this list.
