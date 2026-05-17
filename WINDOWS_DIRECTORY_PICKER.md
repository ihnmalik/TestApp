# Windows Directory Picker Handoff

This project already includes the shared React Native UI in `App.tsx`, the shared JS wrapper in `src/native/DirectoryPicker.ts`, and a Windows C++ native module in `windows/TestApp/DirectoryPicker.*`.

## What Was Added

- `react-native-windows@0.81.21`
- `windows/` React Native Windows project generated with:

```sh
npx react-native init-windows --overwrite
```

- Native module exported as:

```ts
NativeModules.DirectoryPicker
```

The JS API is:

```ts
pickDirectory(): Promise<{ name: string; path: string } | null>
listDirectory(path: string): Promise<Array<{
  name: string;
  path: string;
  isDirectory: boolean;
  size: number | null;
}>>
```

## Windows Developer Setup

1. Use Windows with Visual Studio 2022 and the React Native Windows build prerequisites installed.

2. Install dependencies:

```sh
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is currently needed because `react-native-windows@0.81.21` asks for a newer React 19.1 patch range than this app's React Native 0.81 boilerplate uses.

3. Start Metro:

```sh
npm start
```

4. In another terminal, run Windows:

```sh
npm run windows
```

or:

```sh
npx @react-native-community/cli run-windows
```

## Test Checklist

- The app launches on Windows.
- Clicking `Choose` opens the native Windows folder picker.
- Cancelling the picker leaves the UI unchanged.
- Selecting a folder shows immediate children only.
- Folders are listed before files.
- Files show sizes.
- Inaccessible folders show an error instead of crashing.

## Native Files

- `windows/TestApp/DirectoryPicker.h`
- `windows/TestApp/DirectoryPicker.cpp`
- `windows/TestApp/TestApp.vcxproj`
- `windows/TestApp/TestApp.vcxproj.filters`

The module uses Win32 `IFileOpenDialog` with `FOS_PICKFOLDERS` and `std::filesystem` for directory listing.
