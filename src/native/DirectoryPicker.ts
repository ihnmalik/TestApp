import {NativeModules, Platform} from 'react-native';

export type DirectorySelection = {
  name: string;
  path: string;
};

export type DirectoryEntry = {
  isDirectory: boolean;
  name: string;
  path: string;
  size: number | null;
};

type NativeDirectoryPicker = {
  pickDirectory(): Promise<DirectorySelection | null>;
  listDirectory(path: string): Promise<DirectoryEntry[]>;
};

const nativeModule = NativeModules.DirectoryPicker as
  | NativeDirectoryPicker
  | undefined;

function getDirectoryPicker(): NativeDirectoryPicker {
  if (!nativeModule) {
    throw new Error(
      `Directory picker is not implemented for ${Platform.OS}. Add a native DirectoryPicker module for this platform.`,
    );
  }

  return nativeModule;
}

export async function pickDirectory(): Promise<DirectorySelection | null> {
  return getDirectoryPicker().pickDirectory();
}

export async function listDirectory(path: string): Promise<DirectoryEntry[]> {
  return getDirectoryPicker().listDirectory(path);
}

export function isDirectoryPickerSupported(): boolean {
  return Boolean(nativeModule);
}
