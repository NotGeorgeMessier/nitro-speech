#include <jni.h>
#include "NitroSpeechOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::nitrospeech::initialize(vm);
}
