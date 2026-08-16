from pathlib import Path

import pytest
from PIL import Image

from app import validate_folders
from converter import convert_directory, find_webp_files


def write_webp(path: Path) -> None:
    Image.new("RGB", (2, 2), "red").save(path, "WEBP")


def test_find_webp_files_uses_only_direct_children(tmp_path: Path) -> None:
    write_webp(tmp_path / "b.webp")
    write_webp(tmp_path / "a.WEBP")
    nested = tmp_path / "nested"
    nested.mkdir()
    write_webp(nested / "ignored.webp")

    assert [path.name for path in find_webp_files(tmp_path)] == ["a.WEBP", "b.webp"]


def test_convert_directory_writes_png_and_continues_after_bad_file(tmp_path: Path) -> None:
    source = tmp_path / "source"
    output = tmp_path / "output"
    source.mkdir()
    output.mkdir()
    write_webp(source / "ok.webp")
    (source / "bad.webp").write_bytes(b"not a webp")

    result = convert_directory(source, output)

    assert result.succeeded == 1
    assert result.failed == [source / "bad.webp"]
    assert (output / "ok.png").exists()


def test_validate_folders_returns_existing_directories(tmp_path: Path) -> None:
    source = tmp_path / "source"
    output = tmp_path / "output"
    source.mkdir()
    output.mkdir()

    assert validate_folders(str(source), str(output)) == (source, output)


def test_validate_folders_rejects_missing_directory(tmp_path: Path) -> None:
    output = tmp_path / "output"
    output.mkdir()

    with pytest.raises(ValueError, match="请选择有效的源文件夹"):
        validate_folders(str(tmp_path / "missing"), str(output))
