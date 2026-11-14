from PIL import Image, ImageDraw, ImageFont
import os

WIDTH = 1200
HEIGHT = 630

# Background parchment color
BG_COLOR = (251, 248, 241) # #FBF8F1
INK_COLOR = (27, 26, 23)    # #1B1A17
CRIMSON = (143, 29, 29)    # #8F1D1D
MUTED = (110, 105, 95)     # #6E695F
BORDER_LIGHT = (216, 209, 195) # #D8D1C3

img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# Outer double borders (Broadsheet style)
draw.rectangle([20, 20, WIDTH - 20, HEIGHT - 20], outline=INK_COLOR, width=4)
draw.rectangle([28, 28, WIDTH - 28, HEIGHT - 28], outline=INK_COLOR, width=1)
draw.rectangle([34, 34, WIDTH - 34, HEIGHT - 34], outline=BORDER_LIGHT, width=1)

# Try loading system serif or default fonts
font_masthead = None
font_sub = None
font_desc = None
font_mono = None

font_paths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
]
serif_font_path = None
for p in font_paths:
    if os.path.exists(p):
        serif_font_path = p
        break

if serif_font_path:
    font_masthead = ImageFont.truetype(serif_font_path, 88)
    font_sub = ImageFont.truetype(serif_font_path, 22)
    font_desc = ImageFont.truetype(serif_font_path, 28)
    font_mono = ImageFont.truetype(serif_font_path, 18)
else:
    font_masthead = ImageFont.load_default()
    font_sub = font_masthead
    font_desc = font_masthead
    font_mono = font_masthead

# Header banner
draw.text((WIDTH // 2, 70), "★ EDICIÓN CÍVICA NACIONAL · CONGRESO DE LOS DIPUTADOS Y SENADO ★", fill=CRIMSON, font=font_mono, anchor="mm")
draw.line([(60, 95), (WIDTH - 60, 95)], fill=INK_COLOR, width=2)
draw.line([(60, 100), (WIDTH - 60, 100)], fill=INK_COLOR, width=1)

# Masthead title
draw.text((WIDTH // 2, 180), "QueVotan", fill=INK_COLOR, font=font_masthead, anchor="mm")

# Subtitle
draw.text((WIDTH // 2, 255), "DIARIO CÍVICO DE LA SOBERANÍA POPULAR", fill=MUTED, font=font_sub, anchor="mm")
draw.line([(120, 285), (WIDTH - 120, 285)], fill=INK_COLOR, width=2)
draw.line([(120, 290), (WIDTH - 120, 290)], fill=BORDER_LIGHT, width=1)

# Catchphrase / Explanation
draw.text((WIDTH // 2, 350), "¿Qué aprueba el Congreso y qué vota cada representante?", fill=INK_COLOR, font=font_desc, anchor="mm")
draw.text((WIDTH // 2, 395), "Explicaciones claras sin jerga, datos verificables y despiece del impacto ciudadano real.", fill=MUTED, font=font_mono, anchor="mm")

# Boxes with key features
box_y = 460
box_w = 320
box_h = 90
gap = 35
total_boxes_w = 3 * box_w + 2 * gap
start_x = (WIDTH - total_boxes_w) // 2

boxes_info = [
    ("350 DIPUTADOS", "Sentido de voto nominal", CRIMSON),
    ("IMPACTO CIUDADANO", "Quién gana, quién pierde y costes", INK_COLOR),
    ("NEUTRALIDAD TOTAL", "Sin cookies ni sesgo partidista", (31, 77, 54))
]

for i, (b_title, b_sub, color) in enumerate(boxes_info):
    bx = start_x + i * (box_w + gap)
    draw.rectangle([bx, box_y, bx + box_w, box_y + box_h], fill=(250, 247, 238), outline=INK_COLOR, width=2)
    # Shadow effect
    draw.line([(bx + box_w + 1, box_y + 3), (bx + box_w + 1, box_y + box_h + 3)], fill=INK_COLOR, width=2)
    draw.line([(bx + 3, box_y + box_h + 1), (bx + box_w + 3, box_y + box_h + 1)], fill=INK_COLOR, width=2)
    
    draw.text((bx + box_w // 2, box_y + 28), b_title, fill=color, font=font_mono, anchor="mm")
    draw.text((bx + box_w // 2, box_y + 60), b_sub, fill=MUTED, font=font_mono, anchor="mm")

# Bottom footer
draw.line([(60, 580), (WIDTH - 60, 580)], fill=BORDER_LIGHT, width=1)
draw.text((WIDTH // 2, 595), "quevotan.es · Boletín Oficial de las Cortes Generales y Diario de Sesiones", fill=MUTED, font=font_mono, anchor="mm")

output_path = "/opt/quevotan/public/og-cover.png"
img.save(output_path, "PNG", optimize=True)
print(f"Generated {output_path} ({os.path.getsize(output_path)} bytes)")
