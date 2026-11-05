"""Выгрузка бэкенда и аналитики из рабочего репозитория в общий.

Клон общего репозитория лежит рядом с рабочим: ../full_code (то есть
Карьерный_IT_навигатор/full_code рядом с Карьерный_IT_навигатор/Code).

Общий репозиторий: https://github.com/kayeros/IT-career-navigator — там же фронтенд Евгения.
Скрипт трогает только пути из MANAGED: копирует наши файлы и удаляет внутри этих путей то,
чего у нас больше нет. Всё остальное в общем репозитории (index.html, README.md, screenshots/,
frontend/ и т. д.) не меняется.

Запуск из корня рабочего репозитория:
    python scripts/sync_full_code.py            # показать, что изменится
    python scripts/sync_full_code.py --apply    # применить
Коммит и push в ../full_code делаются отдельно, после просмотра `git -C ../full_code status`.
"""

import argparse
import filecmp
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT.parent / "full_code"

# Папки и файлы, которыми владеет рабочий репозиторий (бэкенд, аналитика, контракт, документация).
MANAGED = [
    "backend/",
    "collector/",
    "api/",
    "docs/",
    "scripts/",
    "docker-compose.yml",
    ".env.example",
    ".gitattributes",
    ".gitignore",
    "CLAUDE.md",
]
# Никогда не выгружаем, даже если файл лежит внутри MANAGED.
EXCLUDE = {"scripts/sync_full_code.py"}


def git_files(repo: Path) -> set[str]:
    """Отслеживаемые и новые (не игнорируемые) файлы репозитория — без .env, сборок и т. п."""
    out = subprocess.run(
        ["git", "-C", str(repo), "ls-files", "-co", "--exclude-standard", "-z"],
        check=True, capture_output=True,
    ).stdout.decode("utf-8")
    return {f for f in out.split("\0") if f}


def managed(path: str) -> bool:
    if path in EXCLUDE:
        return False
    return any(path == m or (m.endswith("/") and path.startswith(m)) for m in MANAGED)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="применить изменения (по умолчанию — только показать)")
    args = parser.parse_args()

    if not (DEST / ".git").is_dir():
        sys.exit(f"нет {DEST} — сначала в папке {ROOT.parent} выполните:\n"
                 "  git clone https://github.com/kayeros/IT-career-navigator.git full_code")

    src = {f for f in git_files(ROOT) if managed(f)}
    dst = {f for f in git_files(DEST) if managed(f)}

    added = sorted(src - dst)
    changed = sorted(f for f in src & dst if not filecmp.cmp(ROOT / f, DEST / f, shallow=False))
    removed = sorted(dst - src)

    for label, files in (("+ новый", added), ("~ изменён", changed), ("- удалён", removed)):
        for f in files:
            print(f"{label:10} {f}")
    print(f"\nновых {len(added)}, изменённых {len(changed)}, удалённых {len(removed)}")

    if not args.apply:
        print("это предпросмотр; для применения добавьте --apply")
        return
    for f in added + changed:
        (DEST / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, DEST / f)
    for f in removed:
        (DEST / f).unlink()
    print(f"готово; проверьте: git -C \"{DEST}\" status")


if __name__ == "__main__":
    main()
