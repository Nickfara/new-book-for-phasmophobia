import os
import logging

def setup_logger(log_file='url_replacement.log'):
    logger = logging.getLogger('URLReplaceLogger')
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # Файл логов
    fh = logging.FileHandler(log_file, encoding='utf-8')
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Консоль
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    return logger

def replace_url_in_files(root_dir, old_url, new_url, extensions=None, logger=None):
    if extensions is None:
        extensions = ['.html', '.js', '.css', '.json', '.txt']

    for root, _, files in os.walk(root_dir):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if old_url in content:
                        updated_content = content.replace(old_url, new_url)
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(updated_content)
                        logger.info(f'SUCCESS: Replaced URL in "{file_path}"')
                    else:
                        logger.debug(f'NO CHANGE: URL not found in "{file_path}"')
                except Exception as e:
                    logger.error(f'ERROR: Processing "{file_path}" failed with error: {e}')

if __name__ == '__main__':
    logger = setup_logger()

    root_directory = './'  # Путь к корню проекта, поменяй при необходимости
    old = 'http://localhost:8000/phasmophobia/static/assets'
    new = 'http://localhost:8000/assets'

    logger.info(f'Starting URL replacement: "{old}" -> "{new}" in directory: "{root_directory}"')
    replace_url_in_files(root_directory, old, new, logger=logger)
    logger.info('URL replacement process completed.')
