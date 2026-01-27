import zipfile
import os

def zip_folder(folder_path, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file == '.DS_Store' or '__pycache__' in root or '.venv' in root or 'node_modules' in root:
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(folder_path))
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    base_dir = '/Users/macbookprom1/mekong-cli'
    source_dir = os.path.join(base_dir, 'products/paid/search-index-kit')
    output_zip = os.path.join(base_dir, 'products/paid/search-index-kit-v1.0.0.zip')
    zip_folder(source_dir, output_zip)
    print(f"Zip created successfully at {output_zip}")
