import os
import zipfile
import shutil

def zip_directory(source_dir, output_filename):
    # Excludes
    exclude_dirs = {'__pycache__', 'node_modules', '.git', '.idea', '.vscode', 'venv'}
    exclude_files = {'.DS_Store'}

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue

                file_path = os.path.join(root, file)
                # Calculate relative path for the zip entry
                arcname = os.path.relpath(file_path, os.path.dirname(source_dir))
                zipf.write(file_path, arcname)

    print(f"Successfully created {output_filename}")

if __name__ == "__main__":
    source = "/Users/macbookprom1/mekong-cli/products/paid/notification-center-kit"
    destination = "/Users/macbookprom1/mekong-cli/products/paid/notification-center-kit-v1.0.0.zip"

    if os.path.exists(source):
        zip_directory(source, destination)
    else:
        print(f"Source directory not found: {source}")
