from pathlib import Path
import math
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO_PATH = ROOT / "public" / "kid-social-logo-dark.png"
OUTPUT_PATH = ROOT / "public" / "kid-social-order-guide.mp4"
WIDTH, HEIGHT, FPS = 1080, 1920, 24
SCENES = [
    ("intro", 4),
    ("what", 6),
    ("account", 5),
    ("service", 7),
    ("order", 7),
    ("wallet", 5),
    ("track", 6),
    ("finish", 5),
]
TOTAL_SECONDS = sum(duration for _, duration in SCENES)
TOTAL_FRAMES = TOTAL_SECONDS * FPS

FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def center(draw, text, y, size, color="#f3fbff", bold=False):
    draw.text((WIDTH // 2, y), text, font=font(size, bold), fill=color, anchor="mm")


def card(draw, box, fill="#10263e", outline="#315573", radius=28):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=2)


def label(draw, text, x, y, size=20, color="#a7c1d6", bold=False):
    draw.text((x, y), text, font=font(size, bold), fill=color)


def pill(draw, box, text, color="#89edc6", fill="#153f3b"):
    draw.rounded_rectangle(box, radius=22, fill=fill)
    draw.text(((box[0] + box[2]) // 2, (box[1] + box[3]) // 2), text, font=font(18, True), fill=color, anchor="mm")


def logo_image(width=570):
    image = Image.open(LOGO_PATH).convert("RGBA")
    image = image.crop(image.getbbox())
    image.thumbnail((width, 220), Image.Resampling.LANCZOS)
    return image


def background(index):
    phase = index / TOTAL_FRAMES
    image = Image.new("RGB", (WIDTH, HEIGHT), "#0d1e33")
    draw = ImageDraw.Draw(image)
    x = int(WIDTH * (0.2 + 0.65 * ((math.sin(phase * math.pi * 2) + 1) / 2)))
    draw.ellipse((x - 300, -220, x + 300, 380), fill="#163d55")
    draw.ellipse((WIDTH - 350, HEIGHT - 580, WIDTH + 170, HEIGHT - 80), fill="#123e45")
    return image, draw


def header(draw, step=None):
    small_logo = logo_image(250)
    small_logo.thumbnail((240, 85), Image.Resampling.LANCZOS)
    return small_logo


def scene_position(frame):
    elapsed = frame / FPS
    current = 0
    for name, duration in SCENES:
        if elapsed < current + duration:
            return name, (elapsed - current) / duration
        current += duration
    return SCENES[-1][0], 1


def make_frame(frame):
    name, local = scene_position(frame)
    image, draw = background(frame)
    if name == "intro":
        logo = logo_image(760)
        image.paste(logo, ((WIDTH - logo.width) // 2, 390), logo)
        center(draw, "Hướng dẫn sử dụng KID Social", 900, 43, bold=True)
        center(draw, "Từ đăng nhập đến theo dõi đơn hàng", 975, 26)
        draw.rounded_rectangle((280, 1110, 800, 1180), radius=35, fill="#168f83")
        center(draw, "XEM TRONG 45 GIÂY", 1145, 24, "#ffffff", True)
    elif name == "what":
        center(draw, "KID Social dùng để làm gì?", 245, 44, bold=True)
        center(draw, "Một dashboard để chọn dịch vụ, tạo đơn và quản lý giao dịch.", 315, 23)
        items = [
            ("01", "Chọn dịch vụ", "Xem nền tảng, máy chủ và mức giá trước khi tạo đơn."),
            ("02", "Tạo đơn nhanh", "Nhập link, số lượng và kiểm tra tổng tiền."),
            ("03", "Theo dõi dễ dàng", "Xem lịch sử và trạng thái từng đơn hàng."),
        ]
        for i, (number, title, description) in enumerate(items):
            y = 515 + i * 300
            card(draw, (90, y, 990, y + 220))
            draw.ellipse((135, y + 48, 225, y + 138), fill="#168f83")
            draw.text((180, y + 93), number, font=font(23, True), fill="#ffffff", anchor="mm")
            label(draw, title, 270, y + 56, 28, "#ffffff", True)
            draw.multiline_text((270, y + 105), description, font=font(20), fill="#a7c1d6", spacing=8)
    elif name == "account":
        center(draw, "Bước 1 · Đăng ký hoặc đăng nhập", 235, 42, bold=True)
        center(draw, "Tạo tài khoản để quản lý số dư và đơn hàng của bạn.", 305, 24)
        card(draw, (110, 470, 970, 1375))
        label(draw, "KID Social", 170, 555, 29, "#ffffff", True)
        label(draw, "Đăng nhập", 170, 625, 36, "#ffffff", True)
        for i, text in enumerate(["Tên đăng nhập hoặc email", "Mật khẩu"]):
            y = 760 + i * 160
            label(draw, text, 170, y, 19)
            draw.rounded_rectangle((170, y + 43, 910, y + 113), radius=12, fill="#17324d", outline="#3d6381", width=2)
            label(draw, "Nhập thông tin của bạn", 195, y + 65, 19, "#7291ab")
        draw.rounded_rectangle((170, 1120, 910, 1194), radius=18, fill="#168f83")
        draw.text((540, 1157), "ĐĂNG NHẬP", font=font(22, True), fill="#ffffff", anchor="mm")
    elif name == "service":
        center(draw, "Bước 2 · Chọn dịch vụ", 205, 42, bold=True)
        center(draw, "Chọn nền tảng, dịch vụ và máy chủ phù hợp.", 275, 24)
        card(draw, (80, 410, 1000, 1500))
        labels = [("NỀN TẢNG", "TikTok"), ("DỊCH VỤ", "TikTok Views"), ("MÁY CHỦ", "Server 1 · Đang hoạt động")]
        for i, (title, value) in enumerate(labels):
            y = 530 + i * 240
            label(draw, title, 140, y, 17, "#78daef", True)
            draw.rounded_rectangle((140, y + 43, 940, y + 125), radius=14, fill="#17324d", outline="#3d6381", width=2)
            label(draw, value, 170, y + 68, 23, "#f3fbff", True)
            draw.text((900, y + 83), "⌄", font=font(27), fill="#78daef", anchor="mm")
        pill(draw, (140, 1280, 480, 1340), "Giá hiển thị trước")
        pill(draw, (500, 1280, 940, 1340), "Chọn được máy chủ")
    elif name == "order":
        center(draw, "Bước 3 · Nhập thông tin đơn", 205, 42, bold=True)
        center(draw, "Dán link, nhập số lượng và kiểm tra chi phí.", 275, 24)
        card(draw, (80, 410, 1000, 1510))
        label(draw, "LIÊN KẾT CẦN XỬ LÝ", 140, 535, 17, "#78daef", True)
        draw.rounded_rectangle((140, 580, 940, 680), radius=14, fill="#17324d", outline="#3d6381", width=2)
        label(draw, "Dán link bài viết hoặc trang cá nhân", 170, 615, 20, "#d2e2f3")
        label(draw, "SỐ LƯỢNG", 140, 780, 17, "#78daef", True)
        draw.rounded_rectangle((140, 825, 940, 925), radius=14, fill="#17324d", outline="#3d6381", width=2)
        label(draw, "1.000", 170, 858, 23, "#f3fbff", True)
        label(draw, "TỔNG THANH TOÁN", 140, 1030, 17, "#78daef", True)
        draw.rounded_rectangle((140, 1080, 940, 1190), radius=14, fill="#153b47")
        label(draw, "Kiểm tra trước khi tạo đơn", 170, 1115, 21, "#a7c1d6")
        label(draw, "0đ", 850, 1110, 28, "#75e5bf", True)
        draw.rounded_rectangle((140, 1270, 940, 1350), radius=18, fill="#168f83")
        draw.text((540, 1310), "TẠO ĐƠN HÀNG", font=font(23, True), fill="#ffffff", anchor="mm")
    elif name == "wallet":
        center(draw, "Bước 4 · Kiểm tra số dư", 245, 42, bold=True)
        center(draw, "Nếu số dư chưa đủ, bạn có thể nạp thêm trước khi gửi đơn.", 315, 23)
        card(draw, (100, 500, 980, 1290))
        label(draw, "Số dư tài khoản", 170, 620, 20)
        label(draw, "0đ", 170, 690, 54, "#75e5bf", True)
        draw.line((170, 800, 910, 800), fill="#304c67", width=2)
        label(draw, "Tạm tính đơn hàng", 170, 890, 20)
        label(draw, "Cần nạp thêm nếu thiếu", 170, 980, 20)
        draw.rounded_rectangle((170, 1100, 910, 1180), radius=18, fill="#226a78")
        draw.text((540, 1140), "NẠP TIỀN NGAY", font=font(23, True), fill="#ffffff", anchor="mm")
    elif name == "track":
        center(draw, "Bước 5 · Theo dõi đơn hàng", 220, 42, bold=True)
        center(draw, "Mở Lịch sử đơn hàng để xem mã và trạng thái xử lý.", 290, 24)
        card(draw, (70, 440, 1010, 1450))
        label(draw, "Lịch sử đơn hàng", 125, 535, 32, "#ffffff", True)
        for i, (code, status, color) in enumerate([
            ("KID-8F2A1", "Đang xử lý", "#f5d492"),
            ("KID-3C91D", "Hoàn thành", "#89edc6"),
            ("KID-7A102", "Đang kiểm tra", "#a1d3ff"),
        ]):
            y = 730 + i * 190
            draw.line((125, y - 55, 955, y - 55), fill="#293e55", width=2)
            label(draw, code, 125, y, 23, "#e7f5ff", True)
            pill(draw, (650, y - 20, 925, y + 40), status, color)
        label(draw, "Có thể mở từng đơn để xem chi tiết.", 125, 1320, 20, "#a7c1d6")
    else:
        center(draw, "Bạn đã sẵn sàng", 360, 54, bold=True)
        center(draw, "Đăng nhập · Chọn dịch vụ · Tạo đơn · Theo dõi", 445, 27)
        logo = logo_image(660)
        image.paste(logo, ((WIDTH - logo.width) // 2, 650), logo)
        draw.rounded_rectangle((150, 1100, 930, 1190), radius=26, fill="#168f83")
        center(draw, "TRUY CẬP WEBSITE", 1145, 25, "#ffffff", True)
        center(draw, "tuongtacmxh.vercel.app", 1305, 31, "#78daef", True)
        center(draw, "Link ở bio · Hỗ trợ trực tiếp", 1370, 23)

    # Scene progress bar.
    draw.rounded_rectangle((90, 1785, 990, 1793), radius=4, fill="#1c3850")
    draw.rounded_rectangle((90, 1785, 90 + int(900 * frame / (TOTAL_FRAMES - 1)), 1793), radius=4, fill="#42d4ba")
    return image


def main():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg, "-y", "-f", "rawvideo", "-vcodec", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS),
        "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT_PATH),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(TOTAL_FRAMES):
            process.stdin.write(make_frame(frame).tobytes())
    finally:
        process.stdin.close()
        process.wait()
    if process.returncode:
        raise SystemExit(process.returncode)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
