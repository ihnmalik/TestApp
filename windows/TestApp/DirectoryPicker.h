#pragma once

#include "JSValue.h"
#include "NativeModules.h"

namespace winrt::TestApp {

REACT_MODULE(DirectoryPicker)
struct DirectoryPicker {
  REACT_METHOD(pickDirectory)
  void pickDirectory(::React::ReactPromise<::React::JSValue> &&result) noexcept;

  REACT_METHOD(listDirectory)
  void listDirectory(std::string path, ::React::ReactPromise<::React::JSValue> &&result) noexcept;
};

} // namespace winrt::TestApp
