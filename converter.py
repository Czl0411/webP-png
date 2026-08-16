from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass
class ConversionResult:
    succeeded: int
    failed: list[Path]


def find_webp_files(source_dir: Path) -> list[Path]:
    return sorted(
        (path for path in source_dir.iterdir() if path.is_file() and path.suffix.lower() == ".webp"),
        key=lambda path: path.name.lower(),
    )


def convert_directory(source_dir: Path, output_dir: Path) -> ConversionResult:
    succeeded = 0
    failed: list[Path] = []

    for source_path in find_webp_files(source_dir):
        try:
            with Image.open(source_path) as image:
                image.save(output_dir / f"{source_path.stem}.png", "PNG")
            succeeded += 1
        except OSError:
            failed.append(source_path)

    return ConversionResult(succeeded=succeeded, failed=failed)
