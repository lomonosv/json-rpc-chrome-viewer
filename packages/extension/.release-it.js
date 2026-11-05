module.exports = {
  hooks: {
    'after:init': ['pnpm exec nx run-many -t lint typecheck build -p extension'],
    // The bumper rewrites manifest.json with its own JSON layout; restore oxfmt's before the release commit.
    'after:bump': ['pnpm exec oxfmt static/manifest.json']
  },
  git: {
    requireCleanWorkingDir: true,
    commitMessage: 'Release v${version}',
    tagAnnotation: 'v${version}',
    push: true
  },
  github: {
    release: true,
    releaseName: 'Release v${version}',
    tokenRef: 'GITHUB_TOKEN'
  },
  npm: {
    publish: false
  },
  plugins: {
    '@release-it/bumper': {
      in: 'static/manifest.json',
      out: ['static/manifest.json', 'build/manifest.json']
    }
  }
};
