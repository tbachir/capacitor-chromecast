import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const podfile = path.join(root, 'ios', 'App', 'Podfile');
const pbxproj = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const replaceInFile = (filePath, replacer) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const before = fs.readFileSync(filePath, 'utf8');
  const after = replacer(before);

  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    return true;
  }

  return false;
};

const podfileChanged = replaceInFile(podfile, content =>
  content.replace(/platform :ios, '14\.0'/g, "platform :ios, '15.0'"),
);

const pbxprojChanged = replaceInFile(pbxproj, content =>
  content.replace(/IPHONEOS_DEPLOYMENT_TARGET = 14\.0;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 15.0;'),
);

if (podfileChanged || pbxprojChanged) {
  console.log('iOS minimum deployment target patched to 15.0');
} else {
  console.log('iOS target patch not needed');
}
