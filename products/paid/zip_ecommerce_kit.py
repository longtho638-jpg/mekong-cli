import os
import zipfile

def zip_directory(source_dir, output_filename, exclude_dirs=None, exclude_files=None):
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to exclude directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue
                if file.endswith('.zip') or file.endswith('.tar.gz'):
                    continue

                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(source_dir))

                print(f"Adding {file_path} as {arcname}")
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    source = "ecommerce-starter-kit"
    output = "ecommerce-starter-kit-v1.0.0.zip"
    exclude_dirs = ["node_modules", ".next", ".git", ".idea", ".vscode", "dist", "build", "coverage"]
    exclude_files = [".DS_Store", ".env", ".env.local"]

    print(f"Zipping {source} to {output}...")
    zip_directory(source, output, exclude_dirs, exclude_files)
    print("Done.")
