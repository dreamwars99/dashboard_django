from pathlib import Path

path = Path('personal/static/personal/styles.css')
text = path.read_text(encoding='utf-8')
needle = "@media (min-width: 961px) {\n  .theme-personal .kb-grid__left,\n  .theme-personal .kb-grid__right {"
if needle in text:
    text = text.replace(needle, "@media (min-width: 961px) {\n  .theme-personal .kb-grid__left,\n  .theme-personal .kb-grid__right {")
    # insert min-height declaration after selector block? need to update block content
target_block = "  .theme-personal .kb-grid__left,\n  .theme-personal .kb-grid__right {\n    position: static;\n    top: auto;\n  }"
replacement = "  .theme-personal .kb-grid__left,\n  .theme-personal .kb-grid__right {\n    position: static;\n    top: auto;\n  }\n\n  .theme-personal .kb-grid__left {\n    min-height: 0;\n  }"
if target_block in text:
    text = text.replace(target_block, replacement)
path.write_text(text, encoding='utf-8')
