const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidSplashFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resPath = path.join(projectRoot, 'android/app/src/main/res');
      const srcPath = path.join(resPath, 'drawable-xxhdpi/splashscreen_logo.png');
      const destPath = path.join(resPath, 'drawable/splashscreen_logo.png');
      const destDir = path.dirname(destPath);

      // Verify source exists
      if (fs.existsSync(srcPath)) {
        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        // Copy the file
        fs.copyFileSync(srcPath, destPath);
        console.log('Successfully copied splashscreen_logo.png to drawable directory.');
      } else {
        console.warn('Warning: splashscreen_logo.png not found in drawable-xxhdpi. Skipping copy.');
      }
      return config;
    },
  ]);
};

module.exports = withAndroidSplashFix;
