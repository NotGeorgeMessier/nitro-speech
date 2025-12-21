import Foundation
import NitroModules

class HybridNitroSpeech : HybridNitroSpeechSpec {
  func add(a: Double,
           b: Double) throws -> Double {
    return a + b
  }

  func sub(a: Double,
           b: Double) throws -> Double {
    return a - b
  }

  func doSomething(str: String) throws -> String {
    return "Hello, im doing \(str)"
  }
}