// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NitroSpeechLogic",
    platforms: [
        .iOS(.v15),
        .macOS(.v13),
    ],
    products: [
        .library(name: "NitroSpeechLogic", targets: ["NitroSpeechLogic"]),
    ],
    targets: [
        .target(
            name: "NitroSpeechLogic",
            path: ".",
            sources: [
                "Logic",
                "Shared/AutoStopper.swift",
                "Shared/ErrorTrace.swift",
                "Audio/AudioLevelTracker.swift",
            ]
        ),
        .testTarget(
            name: "NitroSpeechLogicTests",
            dependencies: ["NitroSpeechLogic"],
            path: "Tests"
        ),
    ]
)
