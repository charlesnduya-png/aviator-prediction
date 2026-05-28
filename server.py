"""Local server + writes phone URL for QR scan page."""
import http.server
import json
import os
import socket
import socketserver
import threading
import webbrowser

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        pass
    try:
        return socket.gethostbyname(socket.gethostname())
    except OSError:
        return "127.0.0.1"


def write_url_file():
    ip = get_lan_ip()
    url = f"http://{ip}:{PORT}"
    path = os.path.join(ROOT, "lan-url.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"url": url, "ip": ip, "port": PORT}, f)
    return url


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)


def main():
    os.chdir(ROOT)
    url = write_url_file()

    print()
    print("  Aviator Pro Predictor - Phone Server")
    print("  =====================================")
    print()
    print(f"  Phone link:  {url}")
    print(f"  QR page:     http://localhost:{PORT}/scan.html")
    print()
    print("  >> QR code window should open on this PC.")
    print("  >> Scan it with your phone camera (same Wi-Fi).")
    print()
    print("  Press Ctrl+C to stop")
    print()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        threading.Timer(
            0.8, lambda: webbrowser.open(f"http://localhost:{PORT}/scan.html")
        ).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")


if __name__ == "__main__":
    main()
