// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "StrasberryCapacitorChromecast",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "StrasberryCapacitorChromecast",
            targets: ["ChromecastPlugin"]
        )
    ],
    dependencies: [
        // Support Capacitor 7 and 8 when integrated through Swift Package Manager.
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "7.0.0"..<"9.0.0"),
        .package(url: "https://github.com/SRGSSR/google-cast-sdk.git", from: "4.8.4")
    ],
    targets: [
        .target(
            name: "ChromecastPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "GoogleCast", package: "google-cast-sdk")
            ],
            path: "ios/Plugin",
            sources: [
                "Chromecast.swift",
                "ChromecastPlugin.swift"
            ]
        )
    ]
)
