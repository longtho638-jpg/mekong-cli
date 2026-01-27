import shutil
import os
import hashlib

def zip_directory(source_dir, output_filename):
    # Create a temporary directory for zipping to control what gets included
    base_name = os.path.splitext(output_filename)[0]

    # shutil.make_archive automatically adds .zip extension, so we strip it for the base_name argument
    # root_dir is the parent directory of the directory we want to zip
    # base_dir is the directory inside root_dir that we want to zip

    # We want to zip 'file-upload-kit' folder so it appears as the root in the zip

    # Filter function to exclude node_modules and .next
    def ignore_patterns(path, names):
        ignore_list = []
        if 'node_modules' in names:
            ignore_list.append('node_modules')
        if '.next' in names:
            ignore_list.append('.next')
        if '.git' in names:
            ignore_list.append('.git')
        if 'coverage' in names:
            ignore_list.append('coverage')
        return ignore_list

    # Using shutil.make_archive directly doesn't easily support ignore patterns in older python versions
    # or requires a custom approach.
    # Let's use zipfile module for more control.

    import zipfile

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', 'coverage']]

            for file in files:
                if file == '.DS_Store':
                    continue

                file_path = os.path.join(root, file)
                # Calculate arcname (relative path inside zip)
                arcname = os.path.relpath(file_path, os.path.dirname(source_dir))
                zipf.write(file_path, arcname)

    print(f"Created {output_filename}")

def generate_sha256(filename):
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    hash_value = sha256_hash.hexdigest()
    with open(f"{filename}.sha256", "w") as f:
        f.write(hash_value)

    print(f"Generated SHA256 for {filename}: {hash_value}")

if __name__ == "__main__":
    source = "file-upload-kit"
    output = "file-upload-kit-v1.0.0.zip"

    if os.path.exists(source):
        zip_directory(source, output)
        generate_sha256(output)
    else:
        print(f"Error: Directory {source} not found.")
