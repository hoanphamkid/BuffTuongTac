from pathlib import Path
import math
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO_PATH = ROOT / "public" / "kid-social-logo-dark.png"
OUTPUT_PATH = ROOT / "public" / "kid-social-promo.mp4"
WIDTH, HEIGHT, FPS, FRAMES = 1080, 1920, 24, 360

FONT_REGULAR = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def centered(draw, text, y, size, fill, bold=False):
    draw.text((WIDTH // 2, y), text, font=font(size, bold), fill=fill, anchor="mm")


def rounded_card(draw, box, fill="#10263e", outline="#315573", radius=28):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=2)


def make_frame(index: int) -> Image.Image:
    progress = index / (FRAMES - 1)
    scene = min(3, int(progress * 4))
    scene_progress = (progress * 4) % 1
    image = Image.new("RGB", (WIDTH, HEIGHT), "#0d1e33")
    draw = ImageDraw.Draw(image)

    # Slow ambient lights keep the static promo feeling alive without distracting motion.
    glow_x = int(WIDTH * (0.18 + 0.64 * ((math.sin(progress * math.pi * 2) + 1) / 2)))
    draw.ellipse((glow_x - 260, -160, glow_x + 260, 360), fill="#163d55")
    draw.ellipse((WIDTH - 300, HEIGHT - 550, WIDTH + 160, HEIGHT - 90), fill="#123e45")

    if scene == 0:
        logo = Image.open(LOGO_PATH).convert("RGBA")
        bbox = logo.getbbox()
        logo = logo.crop(bbox)
        logo.thumbnail((760, 270), Image.Resampling.LANCZOS)
        image.paste(logo, ((WIDTH - logo.width) // 2, 430), logo)
        centered(draw, "Quản lý social gọn hơn", 930, 54, "#f3fbff", True)
        centered(draw, "Chọn dịch vụ, xem giá và theo dõi trạng thái", 1010, 27, "#a7c1d6")
        draw.rounded_rectangle((300, 1130, 780, 1196), radius=33, fill="#168f83")
        centered(draw, "KID SOCIAL", 1163, 25, "#ffffff", True)
    elif scene == 1:
        centered(draw, "Mọi thứ trong một dashboard", 260, 46, "#f3fbff", True)
        centered(draw, "Không cần quản lý thủ công nhiều nơi", 325, 25, "#a7c1d6")
        rounded_card(draw, (85, 490, 995, 1430))
        draw.text((140, 585), "Tạo đơn mới", font=font(33, True), fill="#ffffff")
        labels = [("Nền tảng", "Chọn nền tảng"), ("Dịch vụ", "Chọn dịch vụ"), ("Máy chủ", "Server đang hoạt động")]
        for i, (label, value) in enumerate(labels):
            y = 710 + i * 185
            draw.text((140, y), label, font=font(22), fill="#9fb9d0")
            draw.rounded_rectangle((140, y + 42, 940, y + 114), radius=14, fill="#17324d", outline="#3d6381", width=2)
            draw.text((170, y + 78), value, font=font(24), fill="#e7f5ff", anchor="lm")
            draw.text((900, y + 78), "⌄", font=font(27), fill="#78daef", anchor="mm")
    elif scene == 2:
        centered(draw, "Theo dõi rõ ràng từng đơn", 260, 46, "#f3fbff", True)
        centered(draw, "Giá và trạng thái được hiển thị ngay trên tài khoản", 325, 24, "#a7c1d6")
        rounded_card(draw, (85, 500, 995, 1360))
        draw.text((140, 600), "Lịch sử đơn hàng", font=font(32, True), fill="#ffffff")
        rows = [("KID-8F2A1", "Đang xử lý", "#f5d492"), ("KID-3C91D", "Hoàn thành", "#89edc6"), ("KID-7A102", "Đang kiểm tra", "#a1d3ff")]
        for i, (code, status, color) in enumerate(rows):
            y = 760 + i * 170
            draw.line((140, y - 35, 940, y - 35), fill="#293e55", width=2)
            draw.text((140, y), code, font=font(24, True), fill="#e7f5ff")
            draw.rounded_rectangle((650, y - 26, 910, y + 26), radius=24, fill="#17364a")
            draw.text((780, y), status, font=font(20), fill=color, anchor="mm")
        draw.rounded_rectangle((140, 1245, 940, 1302), radius=28, fill="#17364a")
        draw.text((540, 1273), "Xem chi tiết và hỗ trợ khi cần", font=font(21), fill="#78daef", anchor="mm")
    else:
        centered(draw, "Bắt đầu với KID Social", 390, 54, "#f3fbff", True)
        centered(draw, "Quản lý dịch vụ mạng xã hội", 470, 29, "#a7c1d6")
        logo = Image.open(LOGO_PATH).convert("RGBA")
        bbox = logo.getbbox()
        logo = logo.crop(bbox)
        logo.thumbnail((650, 240), Image.Resampling.LANCZOS)
        image.paste(logo, ((WIDTH - logo.width) // 2, 650), logo)
        draw.rounded_rectangle((150, 1030, 930, 1160), radius=30, fill="#168f83")
        centered(draw, "XEM DỊCH VỤ NGAY", 1095, 27, "#ffffff", True)
        centered(draw, "tuongtacmxh.vercel.app", 1280, 30, "#78daef", True)
        centered(draw, "Link ở bio", 1350, 24, "#a7c1d6")

    # A small progress indicator signals that this is a short product tour.
    draw.rounded_rectangle((90, 1780, 990, 1788), radius=4, fill="#1c3850")
    draw.rounded_rectangle((90, 1780, 90 + int(900 * progress), 1788), radius=4, fill="#42d4ba")
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
        for index in range(FRAMES):
            process.stdin.write(make_frame(index).tobytes())
    finally:
        process.stdin.close()
        process.wait()
    if process.returncode:
        raise SystemExit(process.returncode)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
