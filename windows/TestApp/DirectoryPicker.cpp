#include "pch.h"
#include "DirectoryPicker.h"

#include <algorithm>
#include <cstdint>
#include <cwctype>
#include <filesystem>
#include <shobjidl_core.h>
#include <string>
#include <vector>

namespace winrt::TestApp {

namespace {

struct DirectoryEntry {
  bool isDirectory;
  std::wstring name;
  std::wstring path;
  std::uintmax_t size;
};

std::string ToUtf8(std::wstring const &value) {
  return winrt::to_string(value);
}

std::wstring ToWide(std::string const &value) {
  return winrt::to_hstring(value).c_str();
}

::React::JSValueObject MakeDirectorySelection(std::filesystem::path const &path) {
  return ::React::JSValueObject{
      {"name", ToUtf8(path.filename().wstring())},
      {"path", ToUtf8(path.wstring())},
  };
}

::React::JSValueObject MakeDirectoryEntry(DirectoryEntry const &entry) {
  ::React::JSValueObject object{
      {"isDirectory", entry.isDirectory},
      {"name", ToUtf8(entry.name)},
      {"path", ToUtf8(entry.path)},
  };

  object["size"] = entry.isDirectory ? ::React::JSValue(nullptr)
                                     : ::React::JSValue(static_cast<int64_t>(entry.size));

  return object;
}

std::vector<DirectoryEntry> ReadDirectory(std::filesystem::path const &directoryPath) {
  std::vector<DirectoryEntry> entries;

  for (auto const &item : std::filesystem::directory_iterator(directoryPath)) {
    const bool isDirectory = item.is_directory();
    entries.push_back(DirectoryEntry{
        isDirectory,
        item.path().filename().wstring(),
        item.path().wstring(),
        isDirectory ? 0 : item.file_size(),
    });
  }

  std::sort(entries.begin(), entries.end(), [](DirectoryEntry const &first, DirectoryEntry const &second) {
    if (first.isDirectory != second.isDirectory) {
      return first.isDirectory;
    }

    std::wstring firstName = first.name;
    std::wstring secondName = second.name;
    std::transform(firstName.begin(), firstName.end(), firstName.begin(), ::towlower);
    std::transform(secondName.begin(), secondName.end(), secondName.begin(), ::towlower);
    return firstName < secondName;
  });

  return entries;
}

} // namespace

void DirectoryPicker::pickDirectory(::React::ReactPromise<::React::JSValue> &&result) noexcept {
  winrt::com_ptr<IFileOpenDialog> dialog;
  HRESULT hr = CoCreateInstance(
      CLSID_FileOpenDialog,
      nullptr,
      CLSCTX_INPROC_SERVER,
      IID_PPV_ARGS(dialog.put()));

  if (FAILED(hr)) {
    result.Reject("Unable to create the folder picker.");
    return;
  }

  DWORD options{};
  if (SUCCEEDED(dialog->GetOptions(&options))) {
    dialog->SetOptions(options | FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST);
  }

  hr = dialog->Show(nullptr);
  if (hr == HRESULT_FROM_WIN32(ERROR_CANCELLED)) {
    result.Resolve(::React::JSValue(nullptr));
    return;
  }

  if (FAILED(hr)) {
    result.Reject("Unable to show the folder picker.");
    return;
  }

  winrt::com_ptr<IShellItem> selectedItem;
  hr = dialog->GetResult(selectedItem.put());
  if (FAILED(hr)) {
    result.Reject("Unable to read the selected folder.");
    return;
  }

  PWSTR selectedPath{};
  hr = selectedItem->GetDisplayName(SIGDN_FILESYSPATH, &selectedPath);
  if (FAILED(hr) || selectedPath == nullptr) {
    result.Reject("Unable to read the selected folder path.");
    return;
  }

  std::filesystem::path path{selectedPath};
  CoTaskMemFree(selectedPath);
  result.Resolve(::React::JSValue(MakeDirectorySelection(path)));
}

void DirectoryPicker::listDirectory(
    std::string path,
    ::React::ReactPromise<::React::JSValue> &&result) noexcept {
  try {
    auto entries = ReadDirectory(std::filesystem::path{ToWide(path)});
    ::React::JSValueArray values;
    values.reserve(entries.size());

    for (auto const &entry : entries) {
      values.push_back(::React::JSValue(MakeDirectoryEntry(entry)));
    }

    result.Resolve(::React::JSValue(std::move(values)));
  } catch (std::exception const &ex) {
    result.Reject(ex.what());
  }
}

} // namespace winrt::TestApp
