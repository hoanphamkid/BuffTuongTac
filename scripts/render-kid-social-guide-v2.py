from pathlib import Path
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "kid-social-logo-dark.png"
OUT = ROOT / "public" / "kid-social-order-guide.mp4"
W, H, FPS = 1080, 1920, 24
SIDEBAR = 275
SCENES = [("intro", 4), ("what", 5), ("login", 5), ("service", 7), ("order", 7), ("wallet", 5), ("track", 7), ("finish", 5)]
TOTAL = sum(seconds for _, seconds in SCENES)
TOTAL_FRAMES = TOTAL * FPS

FONT = Path(r"C:\Windows\Fonts\segoeui.ttf")
BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")
NAVY = "#0e1c30"
PANEL = "#101f34"
RAISED = "#192e47"
BORDER = "#304c67"
TEXT = "#e7f0fc"
MUTED = "#a5bad1"
ACCENT = "#78daef"
SUCCESS = "#75e5bf"


def f(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def text(draw, value, xy, size=20, color=TEXT, bold=False, anchor=None):
    draw.text(xy, value, font=f(size, bold), fill=color, anchor=anchor)


def box(draw, coords, fill=PANEL, outline=BORDER, radius=14, width=2):
    draw.rounded_rectangle(coords, radius=radius, fill=fill, outline=outline, width=width)


_LOGO_CACHE = {}


def logo_image(width=205):
    if width in _LOGO_CACHE:
        return _LOGO_CACHE[width].copy()
    image = Image.open(LOGO).convert("RGBA")
    image = image.crop(image.getbbox())
    image.thumbnail((width, 80), Image.Resampling.LANCZOS)
    _LOGO_CACHE[width] = image
    return image.copy()


def base(frame):
    image = Image.new("RGB", (W, H), "#172d43")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, SIDEBAR, H), fill=NAVY)
    draw.rectangle((SIDEBAR, 0, W, H), fill="#1a3049")
    draw.ellipse((W - 160, -180, W + 260, 240), fill="#203e50")
    draw.ellipse((W - 160, H - 360, W + 300, H + 140), fill="#1b3945")
    return image, draw


def sidebar(draw, active="Tạo đơn mới"):
    logo = logo_image(210)
    draw.rectangle((0, 0, SIDEBAR, H), fill=NAVY)
    draw.bitmap((27, 30), logo, fill=None)
    box(draw, (16, 135, SIDEBAR - 16, 215), fill="#172c44", outline=BORDER, radius=10)
    draw.ellipse((29, 153, 67, 191), fill="#2772a8")
    text(draw, "P", (48, 172), 16, "#ffffff", True, "mm")
    text(draw, "preview", (80, 152), 14, "#ffffff", True)
    text(draw, "Số dư: 7.179đ", (80, 177), 11, MUTED)
    y = 270
    text(draw, "DỊCH VỤ & ĐƠN HÀNG", (25, y), 10, "#829fbf", True)
    y += 34
    nav1 = ["Tạo đơn mới", "Đơn hàng hàng loạt", "Lịch sử đơn hàng", "Danh sách dịch vụ", "Hỗ trợ"]
    for item in nav1:
        if item == active:
            box(draw, (16, y - 5, SIDEBAR - 16, y + 34), fill="#20435f", outline="#396586", radius=7, width=1)
            draw.rectangle((16, y - 5, 20, y + 34), fill=ACCENT)
        text(draw, "◈  " + item, (29, y + 15), 13, "#ffffff" if item == active else "#b9cfe4", anchor="lm")
        y += 47
    y += 18
    text(draw, "TÀI KHOẢN", (25, y), 10, "#829fbf", True)
    y += 34
    for item in ["Tài khoản của tôi", "Nạp tiền", "Lịch sử hoàn tiền", "API SMM V2", "Đăng xuất"]:
        text(draw, "◈  " + item, (29, y + 15), 13, "#b9cfe4", anchor="lm")
        y += 47


def topbar(draw, crumb, title, step=None):
    draw.rectangle((SIDEBAR, 0, W, 108), fill="#12243b")
    draw.line((SIDEBAR, 107, W, 107), fill=BORDER, width=2)
    text(draw, crumb, (310, 28), 12, MUTED)
    text(draw, title, (310, 60), 23, "#f4f8ff", True)
    if step:
        box(draw, (820, 36, 1025, 76), fill="#1c4057", outline="#396b7c", radius=20, width=1)
        text(draw, step, (922, 56), 12, ACCENT, True, "mm")


def field(draw, x, y, width, title, value, highlight=False):
    text(draw, title, (x, y), 12, MUTED)
    box(draw, (x, y + 29, x + width, y + 82), fill="#152a42", outline=ACCENT if highlight else "#3b5873", radius=9, width=2)
    text(draw, value, (x + 15, y + 55), 14, TEXT, anchor="lm")


def order_screen(image, draw, focus="service"):
    sidebar(draw, "Tạo đơn mới")
    topbar(draw, "Bảng điều khiển", "Tạo đơn mới", "HƯỚNG DẪN")
    box(draw, (305, 145, 1045, 1510), fill=PANEL, outline=BORDER, radius=14)
    box(draw, (335, 180, 610, 225), fill="#183249", outline="#3b6680", radius=9, width=1)
    text(draw, "Đặt đơn thường", (472, 202), 13, ACCENT, True, "mm")
    box(draw, (618, 180, 890, 225), fill=RAISED, outline=BORDER, radius=9, width=1)
    text(draw, "Gói thử miễn phí", (754, 202), 13, MUTED, True, "mm")
    field(draw, 335, 270, 680, "Liên kết *", "Nhập liên kết cần tăng...", focus == "link")
    field(draw, 335, 405, 315, "Nền tảng", "TikTok", focus == "service")
    field(draw, 670, 405, 345, "Dịch vụ", "TikTok Views", focus == "service")
    text(draw, "Máy chủ", (335, 555), 13, MUTED, True)
    text(draw, "1 lựa chọn", (935, 555), 11, "#abc9de", anchor="ra")
    box(draw, (335, 590, 1015, 735), fill="#183249" if focus == "server" else RAISED, outline=ACCENT if focus == "server" else BORDER, radius=9)
    draw.ellipse((355, 630, 375, 650), outline=ACCENT, width=3)
    draw.ellipse((361, 636, 369, 644), fill=ACCENT)
    text(draw, "Server 1", (400, 615), 15, TEXT, True)
    text(draw, "Mã: server-demo", (400, 645), 11, MUTED)
    text(draw, "Tốc độ: nhanh · Tối thiểu: 100 · Tối đa: 100.000", (400, 677), 11, MUTED)
    text(draw, "0đ / 1000", (900, 630), 14, SUCCESS, True, "ra")
    text(draw, "Đang hoạt động", (900, 660), 11, SUCCESS, anchor="ra")
    field(draw, 335, 790, 680, "Số lượng", "1.000", focus == "quantity")
    box(draw, (335, 930, 1015, 1045), fill="#153b47", outline="#2d6271", radius=10)
    text(draw, "Tổng thanh toán", (360, 965), 12, MUTED)
    text(draw, "0đ", (985, 985), 22, SUCCESS, True, "ra")
    box(draw, (335, 1110, 1015, 1180), fill="#226aba", outline="#2b7bd4", radius=10, width=1)
    text(draw, "TẠO ĐƠN HÀNG", (675, 1145), 14, "#ffffff", True, "mm")
    text(draw, "Giá hiển thị trước khi tạo đơn · Theo dõi trạng thái trong Lịch sử đơn hàng", (335, 1275), 11, MUTED)


def login_screen(image, draw):
    image.paste(Image.new("RGB", (W, H), "#f4f7fb"))
    draw = ImageDraw.Draw(image)
    box(draw, (190, 440, 890, 1420), fill="#ffffff", outline="#dbe4ed", radius=16)
    text(draw, "KID", (540, 570), 43, "#132337", True, "mm")
    text(draw, "Social", (540, 625), 33, "#31c4d8", True, "mm")
    text(draw, "Đăng nhập", (540, 760), 28, "#1c2d4b", True, "mm")
    text(draw, "Đăng nhập để quản lý đơn hàng và số dư", (540, 815), 14, "#7b8ba0", anchor="mm")
    field(draw, 260, 900, 560, "Tên đăng nhập hoặc email", "Nhập thông tin", False)
    field(draw, 260, 1030, 560, "Mật khẩu", "Nhập mật khẩu", False)
    draw.rounded_rectangle((260, 1190, 820, 1260), radius=10, fill="#168f83")
    text(draw, "ĐĂNG NHẬP", (540, 1225), 14, "#ffffff", True, "mm")
    text(draw, "Chưa có tài khoản? Đăng ký ngay", (540, 1330), 13, "#1884a6", anchor="mm")


def wallet_screen(image, draw):
    sidebar(draw, "Nạp tiền")
    topbar(draw, "Tài khoản", "Nạp tiền", "BƯỚC 4")
    box(draw, (305, 145, 1045, 1380), fill=PANEL, outline=BORDER, radius=14)
    text(draw, "Nạp tiền vào tài khoản", (335, 195), 20, TEXT, True)
    text(draw, "Chuyển khoản theo thông tin bên dưới để hệ thống cập nhật số dư.", (335, 240), 12, MUTED)
    box(draw, (335, 310, 635, 720), fill="#13253b", outline=BORDER, radius=12)
    text(draw, "QR THANH TOÁN", (485, 365), 12, ACCENT, True, "mm")
    draw.rectangle((405, 425, 565, 585), fill="#ffffff")
    for x in range(420, 555, 20):
        draw.line((x, 440, x, 565), fill="#13253b", width=5)
    text(draw, "Tạo mã QR sau khi nhập số tiền", (485, 655), 11, MUTED, anchor="mm")
    box(draw, (675, 310, 1015, 720), fill="#13253b", outline=BORDER, radius=12)
    for i, (k, v) in enumerate([("Ngân hàng", "Chưa cấu hình"), ("Chủ tài khoản", "Chưa cấu hình"), ("Nội dung CK", "Mã giao dịch")]):
        text(draw, k, (710, 370 + i * 95), 11, MUTED)
        text(draw, v, (710, 402 + i * 95), 14, TEXT, True)
    field(draw, 335, 820, 680, "Số tiền muốn nạp (VND)", "Nhập số tiền", True)
    box(draw, (335, 1015, 1015, 1085), fill="#168f83", outline="#2aa995", radius=10, width=1)
    text(draw, "TẠO MÃ QR", (675, 1050), 14, "#ffffff", True, "mm")
    text(draw, "Sau khi thanh toán, kiểm tra tại Lịch sử giao dịch.", (335, 1160), 12, MUTED)


def track_screen(image, draw):
    sidebar(draw, "Lịch sử đơn hàng")
    topbar(draw, "Dịch vụ & đơn hàng", "Lịch sử đơn hàng", "BƯỚC 5")
    box(draw, (305, 145, 1045, 1450), fill=PANEL, outline=BORDER, radius=14)
    text(draw, "Lịch sử đơn hàng", (335, 200), 20, TEXT, True)
    text(draw, "Tất cả đơn hàng của tài khoản", (335, 238), 12, MUTED)
    headers = [("Mã đơn", 335), ("Dịch vụ", 500), ("Số lượng", 700), ("Trạng thái", 850)]
    for title, x in headers:
        text(draw, title, (x, 320), 11, MUTED, True)
    rows = [("#KID-8F2A1", "TikTok Views", "1.000", "Đang xử lý", "#f5d492"), ("#KID-3C91D", "Instagram", "2.000", "Hoàn thành", SUCCESS), ("#KID-7A102", "Facebook", "500", "Đang kiểm tra", "#a1d3ff")]
    for i, (code, service, quantity, status, color) in enumerate(rows):
        y = 390 + i * 185
        draw.line((335, y - 35, 1015, y - 35), fill="#293e55", width=2)
        text(draw, code, (335, y), 12, TEXT, True)
        text(draw, service, (500, y), 12, TEXT)
        text(draw, quantity, (700, y), 12, TEXT)
        box(draw, (850, y - 22, 1005, y + 20), fill="#17364a", outline="#315573", radius=20, width=1)
        text(draw, status, (928, y - 1), 10, color, True, "mm")
    text(draw, "Mở từng đơn để xem link, máy chủ và thời gian cập nhật.", (335, 1040), 12, MUTED)


def frame(index):
    seconds = index / FPS
    passed = 0
    scene = SCENES[-1][0]
    for name, duration in SCENES:
        if seconds < passed + duration:
            scene = name
            break
        passed += duration
    image, draw = base(index)
    if scene == "intro":
        sidebar(draw, "Tạo đơn mới")
        topbar(draw, "Bảng điều khiển", "Tạo đơn mới", "HƯỚNG DẪN")
        box(draw, (315, 190, 1035, 1300), fill=PANEL, outline=BORDER, radius=14)
        logo = logo_image(520)
        image.paste(logo, (425, 390), logo)
        text(draw, "Hướng dẫn sử dụng KID Social", (675, 760), 30, TEXT, True, "mm")
        text(draw, "Cách đặt đơn và theo dõi trạng thái trên website", (675, 820), 15, MUTED, anchor="mm")
        box(draw, (480, 950, 870, 1015), fill="#168f83", outline="#2aa995", radius=30, width=1)
        text(draw, "XEM TRONG 45 GIÂY", (675, 983), 14, "#ffffff", True, "mm")
    elif scene == "what":
        sidebar(draw, "Tạo đơn mới")
        topbar(draw, "Bảng điều khiển", "KID Social là gì?", "01 / 06")
        box(draw, (305, 145, 1045, 1470), fill=PANEL, outline=BORDER, radius=14)
        text(draw, "Một nơi để quản lý dịch vụ mạng xã hội", (345, 205), 22, TEXT, True)
        text(draw, "Bạn có thể xem dịch vụ, tạo đơn, nạp tiền và theo dõi giao dịch.", (345, 250), 13, MUTED)
        for i, (title, desc) in enumerate([("Chọn dịch vụ", "Xem nền tảng, server và giá"), ("Tạo đơn", "Nhập link, số lượng và kiểm tra tiền"), ("Theo dõi", "Xem trạng thái trong lịch sử đơn")]):
            y = 390 + i * 280
            box(draw, (345, y, 1000, y + 190), fill=RAISED, outline=BORDER, radius=12)
            draw.ellipse((380, y + 50, 450, y + 120), fill="#168f83")
            text(draw, str(i + 1), (415, y + 85), 22, "#ffffff", True, "mm")
            text(draw, title, (490, y + 55), 18, TEXT, True)
            text(draw, desc, (490, y + 100), 13, MUTED)
    elif scene == "login":
        login_screen(image, draw)
        text(draw, "Bước 1 · Đăng ký hoặc đăng nhập", (540, 150), 26, "#1c2d4b", True, "mm")
    elif scene == "service":
        order_screen(image, draw, "service")
        text(draw, "Bước 2 · Chọn nền tảng, dịch vụ và máy chủ", (675, 1560), 17, TEXT, True, "mm")
    elif scene == "order":
        order_screen(image, draw, "link")
        text(draw, "Bước 3 · Dán link, nhập số lượng và tạo đơn", (675, 1560), 17, TEXT, True, "mm")
    elif scene == "wallet":
        wallet_screen(image, draw)
        text(draw, "Bước 4 · Nạp tiền nếu số dư chưa đủ", (675, 1450), 17, TEXT, True, "mm")
    elif scene == "track":
        track_screen(image, draw)
        text(draw, "Bước 5 · Mở lịch sử đơn để theo dõi", (675, 1510), 17, TEXT, True, "mm")
    else:
        sidebar(draw, "Tạo đơn mới")
        topbar(draw, "Bảng điều khiển", "Bắt đầu với KID Social", "HOÀN TẤT")
        box(draw, (305, 180, 1045, 1280), fill=PANEL, outline=BORDER, radius=14)
        logo = logo_image(510)
        image.paste(logo, (435, 400), logo)
        text(draw, "Đăng nhập · Chọn dịch vụ · Tạo đơn · Theo dõi", (675, 800), 16, TEXT, True, "mm")
        box(draw, (475, 950, 875, 1020), fill="#168f83", outline="#2aa995", radius=12, width=1)
        text(draw, "TRUY CẬP WEBSITE", (675, 985), 14, "#ffffff", True, "mm")
        text(draw, "tuongtacmxh.vercel.app", (675, 1110), 21, ACCENT, True, "mm")
        text(draw, "Link ở bio · Hỗ trợ trực tiếp", (675, 1160), 13, MUTED, anchor="mm")

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((305, 1810, 1040, 1818), radius=4, fill="#1c3850")
    draw.rounded_rectangle((305, 1810, 305 + int(735 * index / (TOTAL_FRAMES - 1)), 1818), radius=4, fill="#42d4ba")
    return image


def main():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUT)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for index in range(TOTAL_FRAMES):
            process.stdin.write(frame(index).tobytes())
    finally:
        process.stdin.close()
        process.wait()
    if process.returncode:
        raise SystemExit(process.returncode)
    print(OUT)


if __name__ == "__main__":
    main()
