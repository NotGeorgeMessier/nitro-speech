#include <jni.h>
#include "NitroSpeechOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::nitrospeech::registerAllNatives();
  });
}
  