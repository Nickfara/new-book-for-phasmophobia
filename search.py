import os

def search_in_files(root_dir, search_text, output_file):
    results = []

    for foldername, _, filenames in os.walk(root_dir):
        for filename in filenames:
            file_path = os.path.join(foldername, filename)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, start=1):
                        if search_text in line:
                            results.append(f"{file_path}:{line_num}: {line.strip()}")
            except Exception:
                # пропускаем бинарные и нечитаемые файлы
                continue

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("\n".join(results))

    print(f"Готово. Найдено {len(results)} совпадений. Результаты сохранены в {output_file}")


if __name__ == "__main__":
    root_directory = "./"   # стартовая папка
    search_string = "phasmaphobia"  # текст для поиска
    output_filename = "search_results.txt"

    search_in_files(root_directory, search_string, output_filename)
