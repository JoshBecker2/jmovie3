const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: 'jmovie3',
    asar: true,
    extraResource: [
      "./lists"
    ],
    ignore: [
      "downloads/"
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@glockx/electron-forge-maker-nsis",
      platforms: ['win32']
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        authors: "Josh Becker",
        setupExe: 'jmovie3-install-oneclick.exe',
        exe: 'jmovie3.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        authors: "Josh Becker"
      }
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['deb'],
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['rpm'],
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
