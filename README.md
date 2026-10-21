# Ultimate Tower Defense

Мобильный sci-fi tower defense. Актуальный паспорт — **v2.13**, прототип — **v0.4**.

## Быстрый старт

Откройте [prototype/index.html](prototype/index.html) в браузере. Установка зависимостей и сборка не нужны.

Проверки игровой логики:

```sh
node tests/prototype-regression.cjs
```

## Запись партии

После победы или поражения нажмите **Save replay** — браузер скачает JSON-файл. Прикрепите его к сообщению с наблюдениями о партии. Запись начинается с **DEPLOY**; ранее сыгранные партии восстановить нельзя.

Для просмотра нажмите **Load replay** в стартовом меню и выберите файл. Игра воспроизведёт действия и проверит итог. Несовместимая версия или расхождение показываются явно. Во время повтора управление постройками отключено.

Проверка без браузера: `node tools/replay-party.cjs путь/к/партии.json`.

## Структура

- [Паспорт проекта v2.13](docs/ultimate-td-passport-v2-13.md) — актуальные решения и текущая повестка.
- [Английский глоссарий v1.3](docs/ultimate-td-glossary-en.md).
- Лор: [RU](docs/ultimate-td-lore-ru.md), [EN](docs/ultimate-td-lore-en.md).
- [Внутриигровые документы v1.4](docs/ultimate-td-documents-en.md) — зафиксированные тексты бланков, ассигнований, роликов и агиток.
- [Визуальные материалы и промпты](docs/art/lienso-redesign-prompts.md).
- [Карта кампании](assets/campaign_ring_map.png).
- [Отчёты проверок](reports/) — исследования баланса и эволюции роя.
- [Фоновая эволюция](reports/background-evolution-v0.2.md) — прогоны расписания и парные ответы; с v2.11 правила перенесены в прототип.
- [История Координатора](reports/coordinator-v0.2.md) — контроль удалённой петли, сохранён как история.
- `prototype/` — играбельный прототип; `tests/` — автоматические проверки; `tools/` — воспроизводимые исследовательские прогоны.

## Версионирование

Номера паспорта и прототипа независимы: паспорт v2.13 не означает игру v2.13.

| Ветка или метка | Назначение |
| --- | --- |
| `main` | Актуальный проект. Старые паспорта не дублируются в файлах. |
| `design/v…` | Архив: снимки паспортов до v2.12 включительно. С v2.13 снимки не режутся — историю держит git (`git log --follow docs/`), релиз помечается тегом `passport/vX.Y`. |
| `prototype/v0.2` | Снимок выпуска v0.2; `main` содержит v0.4 и последующие исправления (метки v0.3 и v0.4 не ставились). |
| `v0.1` | Исходная ветка до наведения порядка; сохранена для восстановления. |

### История паспортов

Снимки до v2.12 — ветками (архив): [v1.1](https://github.com/fouringiz/hunger/tree/design/v1.1), [v1.2](https://github.com/fouringiz/hunger/tree/design/v1.2), [v1.3](https://github.com/fouringiz/hunger/tree/design/v1.3), [v1.4](https://github.com/fouringiz/hunger/tree/design/v1.4), [v1.6](https://github.com/fouringiz/hunger/tree/design/v1.6), [v1.7](https://github.com/fouringiz/hunger/tree/design/v1.7), [v1.8](https://github.com/fouringiz/hunger/tree/design/v1.8), [v1.9](https://github.com/fouringiz/hunger/tree/design/v1.9), [v2.0](https://github.com/fouringiz/hunger/tree/design/v2.0), [v2.1](https://github.com/fouringiz/hunger/tree/design/v2.1), [v2.3](https://github.com/fouringiz/hunger/tree/design/v2.3), [v2.4](https://github.com/fouringiz/hunger/tree/design/v2.4), [v2.6](https://github.com/fouringiz/hunger/tree/design/v2.6), [v2.7](https://github.com/fouringiz/hunger/tree/design/v2.7), [v2.8](https://github.com/fouringiz/hunger/tree/design/v2.8), [v2.9](https://github.com/fouringiz/hunger/tree/design/v2.9), [v2.10](https://github.com/fouringiz/hunger/tree/design/v2.10), [v2.11](https://github.com/fouringiz/hunger/tree/design/v2.11), [v2.12](https://github.com/fouringiz/hunger/tree/design/v2.12). Начиная с v2.13 — теги `passport/vX.Y`.

Снимки импортированы из сохранившихся файлов; v2.4 взят из `files.zip`. Даты коммитов отражают импорт. Отсутствующие версии не восстанавливались предположениями. В каждой исторической ветке оригинальный паспорт находится в `docs/passport.md`; его старые ссылки сохранены как часть исходного документа.

### Дальнейшая работа

1. Изменения вести в коротких рабочих ветках `codex/<тема>`, затем объединять с `main`.
2. При фиксации нового паспорта обновлять актуальный документ в `main` и ставить тег `passport/vX.Y` на коммит релиза. Старые снимки `design/v…` не менять.
3. При выпуске прототипа запускать проверки и создавать новую метку `prototype/vX.Y`. Существующие метки не переносить.

Проверки покрывают движение Пиявки, генераторы, таргетинг, занятость слотов, расписание фоновой эволюции (момент, выбор по счёту урона, лимит стака, перенос на следующую волну) и одинаковый ход боя при разной частоте кадров и скорости игры. Итоговое число сценариев видно при запуске тестов. Они не заменяют визуальный плейтест и проверку баланса.

Симуляция всегда рассчитывается шагами по 1/60 с; частота кадров и переключатель ×2 меняют число шагов за кадр. После долгой остановки вкладки обрабатывается не более 0.25 с реального времени за кадр, чтобы возвращение в игру не вызвало скачок на несколько волн.

Воспроизводимые исследования:

```sh
node tools/check-balance.cjs
node tools/check-evolution-response.cjs
node tools/check-mutation.cjs
node tools/sweep-sprinter.cjs
```

Результаты сохраняются в `reports/generated/` и не включаются в Git. Контроль эволюции сравнивает новую Турель с обычными улучшениями и собирает страницу давления HP ×1.5 для плейтеста; перебор Sprinter сохраняет отклонённый эксперимент как исследовательский инструмент.
