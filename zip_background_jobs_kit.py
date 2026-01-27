import os
import zipfile


def zip_folder(folder_path, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in ['.venv', 'venv', 'node_modules', '__pycache__', '.git', '.DS_Store', 'dist']]

            for file in files:
                if file == '.DS_Store' or file.endswith('.pyc'):
                    continue

                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(folder_path))
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    base_dir = '/Users/macbookprom1/mekong-cli'
    source_dir = os.path.join(base_dir, 'products/paid/background-jobs-kit')
    output_zip = os.path.join(base_dir, 'products/paid/background-jobs-kit-v1.0.0.zip')

    print(f"Zipping {source_dir} to {output_zip}...")
    zip_folder(source_dir, output_zip)
    print(f"Zip created successfully at {output_zip}")
