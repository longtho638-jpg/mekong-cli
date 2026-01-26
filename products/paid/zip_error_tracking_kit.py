import os
import zipfile

def zip_directory(source_dir, output_filename):
    # Excludes
    exclude_dirs = {'__pycache__', 'node_modules', '.git', '.idea', '.vscode', 'venv', 'dist', 'build', '.DS_Store'}
    exclude_files = {'.DS_Store', '.env'}

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Get the parent directory of source_dir to make arcname include the source_dir name
        parent_dir = os.path.dirname(source_dir)

        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue

                file_path = os.path.join(root, file)
                # Calculate relative path for the zip entry so it includes the top-level folder
                arcname = os.path.relpath(file_path, parent_dir)
                zipf.write(file_path, arcname)

    print(f"Successfully created {output_filename}")

if __name__ == "__main__":
    source = "/Users/macbookprom1/mekong-cli/products/paid/error-tracking-kit"
    destination = "/Users/macbookprom1/mekong-cli/products/paid/error-tracking-kit-v1.0.0.zip"

    if os.path.exists(source):
        zip_directory(source, destination)
    else:
        print(f"Source directory not found: {source}")
