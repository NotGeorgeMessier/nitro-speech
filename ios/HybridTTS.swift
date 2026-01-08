import Foundation
import NitroModules

class HybridTTS : HybridTTSSpec {
    func add(a: Double, b: Double) throws -> Double {
        return a + b
    }
    
    func speak(text: String, params: TTSParams) throws -> Void {
        return;
    }
    
    func isSpeaking() throws -> Promise<Bool> {
        return Promise.resolved(withResult: false)
    }
    
    func stop() throws -> Void {
        return;
    }
    
    func pause() throws -> Promise<Bool> {
        return Promise.resolved(withResult: false)
    }
    
    func resume() throws -> Promise<Bool> {
        return Promise.resolved(withResult: false)
    }
}
