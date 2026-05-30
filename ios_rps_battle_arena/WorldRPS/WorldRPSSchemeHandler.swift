import Foundation
import WebKit

final class WorldRPSSchemeHandler: NSObject, WKURLSchemeHandler {
    private let rootDirectory = "world-rps"

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url,
              let fileURL = bundledFileURL(for: requestURL) else {
            finish(urlSchemeTask, url: urlSchemeTask.request.url, statusCode: 404, data: Data())
            return
        }

        do {
            let data = try Data(contentsOf: fileURL)
            let response = URLResponse(
                url: requestURL,
                mimeType: mimeType(for: fileURL.pathExtension),
                expectedContentLength: data.count,
                textEncodingName: textEncoding(for: fileURL.pathExtension)
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            finish(urlSchemeTask, url: requestURL, statusCode: 500, data: Data())
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func bundledFileURL(for url: URL) -> URL? {
        guard url.host == "app" else { return nil }
        let rawPath = url.path == "/" ? "/index.html" : url.path
        let cleanComponents = rawPath
            .split(separator: "/")
            .filter { !$0.isEmpty && $0 != "." && $0 != ".." }
            .map(String.init)
        guard !cleanComponents.isEmpty else { return nil }
        var resourceURL = Bundle.main.resourceURL?.appendingPathComponent(rootDirectory, isDirectory: true)
        for component in cleanComponents {
            resourceURL = resourceURL?.appendingPathComponent(component)
        }
        return resourceURL
    }

    private func finish(_ task: WKURLSchemeTask, url: URL?, statusCode: Int, data: Data) {
        let response = HTTPURLResponse(
            url: url ?? URL(string: "worldrps://app/")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: ["Content-Length": "\(data.count)"]
        )!
        task.didReceive(response)
        if !data.isEmpty {
            task.didReceive(data)
        }
        task.didFinish()
    }

    private func mimeType(for fileExtension: String) -> String {
        switch fileExtension.lowercased() {
        case "html":
            return "text/html"
        case "css":
            return "text/css"
        case "js", "mjs":
            return "text/javascript"
        case "json":
            return "application/json"
        case "png":
            return "image/png"
        case "jpg", "jpeg":
            return "image/jpeg"
        case "svg":
            return "image/svg+xml"
        case "mp3":
            return "audio/mpeg"
        default:
            return "application/octet-stream"
        }
    }

    private func textEncoding(for fileExtension: String) -> String? {
        switch fileExtension.lowercased() {
        case "html", "css", "js", "mjs", "json", "svg":
            return "utf-8"
        default:
            return nil
        }
    }
}

