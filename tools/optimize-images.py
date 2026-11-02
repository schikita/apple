#!/usr/bin/env python3
"""
Оптимизация изображений проекта «Яблочная история» (assets/img).

Что делает:
  * пересобирает WebP-версии из исходных .jpg/.png в тех размерах, в которых
    картинки реально показываются на сайте (фон секции не нужен в 3500px,
    вертикальное фото в медиа-ряду показывается ~514px);
  * для ленты marquee делает дополнительно уменьшенные превью `*-600.webp`;
  * не трогает исходники — они остаются рядом и используются как фолбэк/бэкап.

Запуск (из корня проекта):
    python3 tools/optimize-images.py            # только устаревшие/новые файлы
    python3 tools/optimize-images.py --force    # пересобрать всё

Требуется Pillow:  pip install pillow

После конвертации ссылки в index.html / styles.css указывают на .webp
(движок подбора размеров описан в RULES ниже).
"""

import os
import sys

from PIL import Image

BASE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img'))
RESAMPLE = Image.Resampling.LANCZOS

# (файл, ширина, качество, имя результата)
RULES = []

# --- фоны секций на всю ширину экрана: 1600px, q64 (закрыты градиентными оверлеями) ---
for name in ('hero', 'drop_apple', 'second', 'virostit_malo', 'osnova', 'universe',
             'bg-projects', 'slider/bg', 'pererabotka/bg'):
    src = name + ('.png' if name == 'second' else '.jpg')
    RULES.append((src, 1600, 64, name + '.webp'))

# --- галерея-слайдер: большое фото для галереи и лайтбокса + превью для marquee ---
for i in range(1, 5):
    RULES.append(('slider/%d.jpg' % i, 1600, 80, 'slider/%d.webp' % i))
    RULES.append(('slider/%d.jpg' % i, 600, 78, 'slider/%d-600.webp' % i))

# --- карусели в тексте статьи ---
for name in ('tree', 'rannie_sorta', 'sad'):
    RULES.append((name + '.jpg', 1400, 80, name + '.webp'))
for i in range(1, 5):
    RULES.append(('product/%d.jpg' % i, 1400, 80, 'product/%d.webp' % i))
    RULES.append(('product/%d.jpg' % i, 600, 78, 'product/%d-600.webp' % i))
for i in range(1, 6):
    RULES.append(('pererabotka/%d.jpg' % i, 1400, 80, 'pererabotka/%d.webp' % i))

# --- фото в медиа-рядах (показываются ~500-600px, 2x для retina) ---
for name in ('upast_negde', 'rsort', 'sad123', '110', 'hranenie', 'postavki',
             'director', 'fermers', 'lab'):
    src = name + ('.png' if name in ('upast_negde', '110', 'hranenie', 'postavki', 'director') else '.jpg')
    RULES.append((src, 1200, 80, name + '.webp'))

# --- карточки проектов ---
for name in ('projects/Voenkor2026-28-08-2026-44', 'projects/hero', 'projects/2'):
    RULES.append((name + '.jpg', 1000, 80, name + '.webp'))


def to_rgb_or_rgba(im):
    """Фото без прозрачности переводим в RGB — так WebP заметно легче."""
    if im.mode in ('RGBA', 'LA', 'P'):
        rgba = im.convert('RGBA')
        return rgba.convert('RGB') if rgba.getchannel('A').getextrema()[0] == 255 else rgba
    if im.mode != 'RGB':
        return im.convert('RGB')
    return im


def main():
    force = '--force' in sys.argv
    if not os.path.isdir(BASE):
        sys.exit('Не найдена папка %s' % BASE)

    done, skipped, missing = [], 0, []
    for src_rel, width, quality, out_rel in RULES:
        src, out = os.path.join(BASE, src_rel), os.path.join(BASE, out_rel)
        if not os.path.exists(src):
            missing.append(src_rel)
            continue
        if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            skipped += 1
            continue

        im = to_rgb_or_rgba(Image.open(src))
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), RESAMPLE)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, 'WEBP', quality=quality, method=6)

        before, after = os.path.getsize(src), os.path.getsize(out)
        done.append((src_rel, before, after, out_rel))
        print('%-44s %7.0fK -> %6.0fK  (%2.0f%%)  %s'
              % (src_rel, before / 1024, after / 1024, 100 * after / before, out_rel))

    print('\nсобрано: %d, уже актуальны: %d' % (len(done), skipped))
    if done:
        b = sum(x[1] for x in done)
        a = sum(x[2] for x in done)
        print('итого в этой сборке: %.2f МБ -> %.2f МБ' % (b / 1048576, a / 1048576))
    if missing:
        print('нет исходников (пропущены): %s' % ', '.join(missing))


if __name__ == '__main__':
    main()
