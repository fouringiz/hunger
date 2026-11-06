# Стиль техники людей

- `platform-colorref-v1.webp` — цветовой эталон: рендер принятой Meshy-платформы; прикладывается первым референсом ко всем промптам ChatGPT и к генерациям Meshy.
- `palette.json` — единственный цветовой канон для всех башен: роли цветов (olive, olive_dark, steel, steel_dark, edge_light, grime, black, orange, teal, brass), значения, допуск по оттенку и таблица `zones` — какая роль задаёт базовый цвет каждого материала Blender (olive_plate, graphite_frame, steel_dark, brass_band, orange_accent, teal_indicator). Референс Meshy отвечает за форму, раскладку зон, детали и износ, не за цвет; разница цвета с референсом — не дефект.

Оба файла кладёт пользователь из `~/Downloads/platform_colorref.png` (уменьшить до 1600 px, WebP) и `~/Downloads/palette.json`.
