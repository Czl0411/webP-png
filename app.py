import tkinter as tk
from pathlib import Path
from tkinter import filedialog, ttk

from converter import convert_directory


def validate_folders(source_text: str, output_text: str) -> tuple[Path, Path]:
    source_dir = Path(source_text)
    output_dir = Path(output_text)

    if not source_dir.is_dir():
        raise ValueError("请选择有效的源文件夹")
    if not output_dir.is_dir():
        raise ValueError("请选择有效的输出文件夹")

    return source_dir, output_dir


class WebpToPngApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.source_path = tk.StringVar()
        self.output_path = tk.StringVar()
        self.status = tk.StringVar(value="请选择源文件夹和输出文件夹")

        root.title("WebP 批量转 PNG")
        root.resizable(False, False)

        frame = ttk.Frame(root, padding=16)
        frame.grid()

        self._add_folder_row(frame, "源文件夹", self.source_path, self.choose_source, 0)
        self._add_folder_row(frame, "输出文件夹", self.output_path, self.choose_output, 1)

        self.convert_button = ttk.Button(frame, text="开始转换", command=self.convert)
        self.convert_button.grid(row=2, column=0, columnspan=3, pady=(14, 8))

        ttk.Label(frame, textvariable=self.status, wraplength=460).grid(
            row=3, column=0, columnspan=3, sticky="w"
        )

    def _add_folder_row(
        self,
        frame: ttk.Frame,
        label: str,
        path: tk.StringVar,
        command: object,
        row: int,
    ) -> None:
        ttk.Label(frame, text=label).grid(row=row, column=0, sticky="w", padx=(0, 8), pady=5)
        ttk.Entry(frame, textvariable=path, width=52, state="readonly").grid(row=row, column=1, pady=5)
        ttk.Button(frame, text="选择文件夹", command=command).grid(row=row, column=2, padx=(8, 0), pady=5)

    def choose_source(self) -> None:
        selected = filedialog.askdirectory(title="选择源文件夹")
        if selected:
            self.source_path.set(selected)

    def choose_output(self) -> None:
        selected = filedialog.askdirectory(title="选择输出文件夹")
        if selected:
            self.output_path.set(selected)

    def convert(self) -> None:
        try:
            source_dir, output_dir = validate_folders(self.source_path.get(), self.output_path.get())
        except ValueError as error:
            self.status.set(str(error))
            return

        self.convert_button.state(["disabled"])
        self.status.set("正在转换，请稍候…")
        self.root.update_idletasks()

        result = convert_directory(source_dir, output_dir)

        self.convert_button.state(["!disabled"])
        if result.succeeded == 0 and not result.failed:
            self.status.set("未找到 WebP 图片")
        else:
            self.status.set(f"完成：成功 {result.succeeded} 张，失败 {len(result.failed)} 张")


def main() -> None:
    root = tk.Tk()
    WebpToPngApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
