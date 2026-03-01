#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const rootDir = process.cwd();

const paths = {
  definitions: path.join(rootDir, 'src/definitions.ts'),
  iosSwift: path.join(rootDir, 'ios/Plugin/ChromecastPlugin.swift'),
  iosObjc: path.join(rootDir, 'ios/Plugin/ChromecastPlugin.m'),
  android: path.join(
    rootDir,
    'android/src/main/java/com/tbachir/plugins/chromecast/Chromecast.java',
  ),
};

const ignoredInterfaceMethods = new Set(['addListener', 'removeAllListeners']);

let hasErrors = false;

function reportError(message) {
  hasErrors = true;
  console.error(`- ${message}`);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    reportError(`Cannot read file: ${filePath}\n  ${error.message}`);
    return '';
  }
}

function getPromiseInfo(methodName, typeNode, sourceFile) {
  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) {
    reportError(
      `Method "${methodName}" in definitions must return Promise<...> (missing type reference).`,
    );
    return { isPromise: false, isVoidPromise: false, returnTypeText: 'unknown' };
  }

  const typeName = typeNode.typeName.getText(sourceFile);
  const returnTypeText = typeNode.getText(sourceFile);
  if (typeName !== 'Promise') {
    reportError(
      `Method "${methodName}" in definitions must return Promise<...> (found ${returnTypeText}).`,
    );
    return { isPromise: false, isVoidPromise: false, returnTypeText };
  }

  const typeArg = typeNode.typeArguments?.[0];
  const isVoidPromise = !!typeArg && typeArg.kind === ts.SyntaxKind.VoidKeyword;
  return { isPromise: true, isVoidPromise, returnTypeText };
}

function parseDefinitions() {
  const text = readFile(paths.definitions);
  if (!text) return new Map();

  const sourceFile = ts.createSourceFile(
    paths.definitions,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let pluginInterface;
  function walk(node) {
    if (
      ts.isInterfaceDeclaration(node) &&
      node.name.getText(sourceFile) === 'ChromecastPlugin'
    ) {
      pluginInterface = node;
      return;
    }
    ts.forEachChild(node, walk);
  }
  walk(sourceFile);

  if (!pluginInterface) {
    reportError('Interface "ChromecastPlugin" not found in src/definitions.ts.');
    return new Map();
  }

  const methods = new Map();
  for (const member of pluginInterface.members) {
    if (!ts.isMethodSignature(member)) continue;

    const methodName = member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
    if (ignoredInterfaceMethods.has(methodName)) continue;

    const promiseInfo = getPromiseInfo(methodName, member.type, sourceFile);
    methods.set(methodName, {
      ...promiseInfo,
      expectedNativeReturnType: promiseInfo.isVoidPromise ? 'none' : 'promise',
    });
  }

  return methods;
}

function parseIosSwiftMethods() {
  const text = readFile(paths.iosSwift);
  const methods = new Map();
  const regex =
    /CAPPluginMethod\(name:\s*"([A-Za-z_][A-Za-z0-9_]*)",\s*returnType:\s*(CAPPluginReturn[A-Za-z]+)\)/g;

  for (const match of text.matchAll(regex)) {
    methods.set(match[1], match[2]);
  }

  return methods;
}

function parseIosObjcMethods() {
  const text = readFile(paths.iosObjc);
  const methods = new Map();
  const regex =
    /CAP_PLUGIN_METHOD\(([A-Za-z_][A-Za-z0-9_]*),\s*(CAPPluginReturn[A-Za-z]+)\)/g;

  for (const match of text.matchAll(regex)) {
    methods.set(match[1], match[2]);
  }

  return methods;
}

function parseAndroidMethods() {
  const text = readFile(paths.android);
  const lines = text.split(/\r?\n/);
  const methods = new Map();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('@PluginMethod')) continue;

    const returnNone = /RETURN_NONE/.test(trimmed);
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (
        !next ||
        next.startsWith('//') ||
        next.startsWith('/*') ||
        next.startsWith('*') ||
        next.startsWith('@')
      ) {
        j++;
        continue;
      }

      const signatureMatch = next.match(
        /public\s+[A-Za-z0-9_<>,\s]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*(?:final\s+)?PluginCall\b/,
      );
      if (signatureMatch) {
        methods.set(signatureMatch[1], {
          returnNone,
          line: j + 1,
        });
      }
      break;
    }
  }

  return methods;
}

function checkMethodSet(expectedMethods, actualMethods, platformLabel) {
  for (const methodName of expectedMethods.keys()) {
    if (!actualMethods.has(methodName)) {
      reportError(`${platformLabel}: missing method "${methodName}".`);
    }
  }

  for (const methodName of actualMethods.keys()) {
    if (!expectedMethods.has(methodName)) {
      reportError(
        `${platformLabel}: method "${methodName}" is exposed natively but missing from definitions.`,
      );
    }
  }
}

function checkIosReturnTypes(expectedMethods, swiftMethods, objcMethods) {
  for (const [methodName, details] of expectedMethods) {
    const expectedIosReturn =
      details.expectedNativeReturnType === 'none'
        ? 'CAPPluginReturnNone'
        : 'CAPPluginReturnPromise';

    const swiftReturn = swiftMethods.get(methodName);
    if (swiftReturn && swiftReturn !== expectedIosReturn) {
      reportError(
        `iOS Swift: method "${methodName}" should use ${expectedIosReturn} but uses ${swiftReturn}.`,
      );
    }

    const objcReturn = objcMethods.get(methodName);
    if (objcReturn && objcReturn !== expectedIosReturn) {
      reportError(
        `iOS ObjC: method "${methodName}" should use ${expectedIosReturn} but uses ${objcReturn}.`,
      );
    }
  }

  for (const [methodName, swiftReturn] of swiftMethods) {
    const objcReturn = objcMethods.get(methodName);
    if (!objcReturn) continue;
    if (swiftReturn !== objcReturn) {
      reportError(
        `iOS mismatch: method "${methodName}" differs between Swift (${swiftReturn}) and ObjC (${objcReturn}).`,
      );
    }
  }
}

function checkAndroidReturnTypes(expectedMethods, androidMethods) {
  for (const [methodName, details] of expectedMethods) {
    const androidMethod = androidMethods.get(methodName);
    if (!androidMethod) continue;

    if (details.expectedNativeReturnType === 'none' && !androidMethod.returnNone) {
      reportError(
        `Android: method "${methodName}" should declare @PluginMethod(returnType = PluginMethod.RETURN_NONE).`,
      );
    }

    if (details.expectedNativeReturnType !== 'none' && androidMethod.returnNone) {
      reportError(
        `Android: method "${methodName}" should not use RETURN_NONE (it returns Promise data).`,
      );
    }
  }
}

function run() {
  const expectedMethods = parseDefinitions();
  const swiftMethods = parseIosSwiftMethods();
  const objcMethods = parseIosObjcMethods();
  const androidMethods = parseAndroidMethods();

  if (expectedMethods.size === 0) {
    reportError('No plugin methods discovered in definitions; aborting contract check.');
  }
  if (swiftMethods.size === 0) {
    reportError('No iOS methods found in ChromecastPlugin.swift.');
  }
  if (objcMethods.size === 0) {
    reportError('No iOS methods found in ChromecastPlugin.m.');
  }
  if (androidMethods.size === 0) {
    reportError('No Android @PluginMethod methods found in Chromecast.java.');
  }

  checkMethodSet(expectedMethods, swiftMethods, 'iOS Swift');
  checkMethodSet(expectedMethods, objcMethods, 'iOS ObjC');
  checkMethodSet(expectedMethods, androidMethods, 'Android');

  checkIosReturnTypes(expectedMethods, swiftMethods, objcMethods);
  checkAndroidReturnTypes(expectedMethods, androidMethods);

  if (hasErrors) {
    console.error('\nPlugin contract check failed.');
    process.exit(1);
  }

  console.log(
    `Plugin contract check passed (${expectedMethods.size} methods validated across definitions + iOS + Android).`,
  );
}

run();
