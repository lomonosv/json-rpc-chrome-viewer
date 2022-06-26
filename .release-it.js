module.exports = {
  'hooks': {
    'after:init': [
      'npm run lint',
      'tsc -noEmit',
      'node scripts/build.js'
    ]
  },
  'git': {
    'requireCleanWorkingDir': true,
    'commitMessage': 'Release v${version}',
    'tagAnnotation': 'v${version}',
    'push': true
  },
  'github': {
    'release': true,
    'releaseName': 'Release v${version}',
    'tokenRef': 'GITHUB_TOKEN'
  },
  'npm': {
    'publish': false
  },
  'plugins': {
    '@release-it/bumper': {
      'in': 'static/manifest.json',
      'out': 'static/manifest.json'
    }
  }
};
