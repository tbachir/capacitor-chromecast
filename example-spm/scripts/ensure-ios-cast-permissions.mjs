import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const infoPlistPath = path.join(root, 'ios', 'App', 'App', 'Info.plist');

const LOCAL_NETWORK_KEY = '<key>NSLocalNetworkUsageDescription</key>';
const BONJOUR_KEY = '<key>NSBonjourServices</key>';
const LOCAL_NETWORK_BLOCK = `\t<key>NSLocalNetworkUsageDescription</key>\n\t<string>Chromecast discovery requires access to devices on your local network.</string>\n`;
const BONJOUR_BLOCK = `\t<key>NSBonjourServices</key>\n\t<array>\n\t\t<string>_googlecast._tcp</string>\n\t\t<string>_FB38EA42._googlecast._tcp</string>\n\t</array>\n`;
const REQUIRED_BONJOUR_SERVICES = ['_googlecast._tcp', '_FB38EA42._googlecast._tcp'];

if (!fs.existsSync(infoPlistPath)) {
  console.log('Info.plist not found, skipping cast permissions patch');
  process.exit(0);
}

let plist = fs.readFileSync(infoPlistPath, 'utf8');
let changed = false;

const insertBeforeDictEnd = (content, block) => {
  if (!content.includes('</dict>')) {
    return content;
  }
  return content.replace('</dict>', `${block}</dict>`);
};

if (!plist.includes(LOCAL_NETWORK_KEY)) {
  const next = insertBeforeDictEnd(plist, LOCAL_NETWORK_BLOCK);
  if (next !== plist) {
    plist = next;
    changed = true;
  }
}

if (!plist.includes(BONJOUR_KEY)) {
  const next = insertBeforeDictEnd(plist, BONJOUR_BLOCK);
  if (next !== plist) {
    plist = next;
    changed = true;
  }
} else {
  const bonjourArrayPattern = /<key>NSBonjourServices<\/key>\s*<array>([\s\S]*?)<\/array>/;
  const match = plist.match(bonjourArrayPattern);

  if (match) {
    let bonjourBlock = match[0];
    let updatedBlock = bonjourBlock;

    for (const service of REQUIRED_BONJOUR_SERVICES) {
      const serviceTag = `<string>${service}</string>`;
      if (!updatedBlock.includes(serviceTag)) {
        updatedBlock = updatedBlock.replace('</array>', `\t\t${serviceTag}\n\t</array>`);
      }
    }

    if (updatedBlock !== bonjourBlock) {
      plist = plist.replace(bonjourBlock, updatedBlock);
      changed = true;
    }
  }
}

if (changed) {
  fs.writeFileSync(infoPlistPath, plist, 'utf8');
  console.log('iOS cast network permissions patched in Info.plist');
} else {
  console.log('iOS cast network permissions already configured');
}
