import os
from PIL import Image, ImageDraw

base_dir = 'android-res'
os.makedirs(f'{base_dir}/values', exist_ok=True)
os.makedirs(f'{base_dir}/mipmap-anydpi-v26', exist_ok=True)

# 1. Colors & XMLs
with open(f'{base_dir}/values/ic_launcher_background.xml', 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1e3a8a</color>\n</resources>\n')

adaptive_xml = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n'

with open(f'{base_dir}/mipmap-anydpi-v26/ic_launcher.xml', 'w', encoding='utf-8') as f:
    f.write(adaptive_xml)

with open(f'{base_dir}/mipmap-anydpi-v26/ic_launcher_round.xml', 'w', encoding='utf-8') as f:
    f.write(adaptive_xml)

# 2. Master Image
src = Image.open('assets/app_icon.png').convert('RGBA')

densities = {
    'mipmap-mdpi': (48, 108),
    'mipmap-hdpi': (72, 162),
    'mipmap-xhdpi': (96, 216),
    'mipmap-xxhdpi': (144, 324),
    'mipmap-xxxhdpi': (192, 432),
}

for folder, (size_std, size_fore) in densities.items():
    path = f'{base_dir}/{folder}'
    os.makedirs(path, exist_ok=True)
    
    # 2a. Standard ic_launcher.png (Rounded rectangle)
    img_std = src.resize((size_std, size_std), Image.Resampling.LANCZOS)
    img_std.save(f'{path}/ic_launcher.png')
    
    # 2b. Round ic_launcher_round.png
    mask_round = Image.new('L', (size_std, size_std), 0)
    draw_round = ImageDraw.Draw(mask_round)
    draw_round.ellipse((0, 0, size_std, size_std), fill=255)
    img_round = Image.new('RGBA', (size_std, size_std), (0, 0, 0, 0))
    img_round.paste(img_std, (0, 0), mask_round)
    img_round.save(f'{path}/ic_launcher_round.png')
    
    # 2c. Foreground ic_launcher_foreground.png (Centered icon on transparent canvas for adaptive icons)
    icon_inner_size = int(size_fore * 0.72)
    img_inner = src.resize((icon_inner_size, icon_inner_size), Image.Resampling.LANCZOS)
    
    # Create transparent canvas
    fore_canvas = Image.new('RGBA', (size_fore, size_fore), (0, 0, 0, 0))
    offset = (size_fore - icon_inner_size) // 2
    fore_canvas.paste(img_inner, (offset, offset))
    fore_canvas.save(f'{path}/ic_launcher_foreground.png')

print('All Android mipmap and adaptive icon resources generated in android-res!')
