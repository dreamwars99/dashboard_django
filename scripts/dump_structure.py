#!/usr/bin/env python3
"""Generate repo_structure.txt with a simple directory listing."""
from __future__ import annotations

import os
from pathlib import Path

EXCLUDED_DIRS = {
    '.git',
    '.idea',
    '.vscode',
    '__pycache__',
    'staticfiles',
    'media',
    'node_modules',
    '.venv',
    'env',
    '.mypy_cache',
}

EXCLUDED_FILES = {
    'repo_structure.txt',
}


def should_skip_dir(dirname: str) -> bool:
    return dirname in EXCLUDED_DIRS or (dirname.startswith('.') and dirname not in {'.github'})


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    lines: list[str] = []

    for current_dir, dirnames, filenames in os.walk(root):
        rel_dir = Path(current_dir).relative_to(root)
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]
        dirnames.sort()
        filenames = [f for f in filenames if f not in EXCLUDED_FILES]
        filenames.sort()

        if rel_dir == Path('.'):
            rel_dir_str = ''
        else:
            rel_dir_str = str(rel_dir).replace('\\', '/')
            lines.append(f"{rel_dir_str}/")

        for filename in filenames:
            rel_path = (rel_dir / filename) if rel_dir_str else Path(filename)
            lines.append(str(rel_path).replace('\\', '/'))

    output = root / 'repo_structure.txt'
    output.write_text('\n'.join(lines) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
