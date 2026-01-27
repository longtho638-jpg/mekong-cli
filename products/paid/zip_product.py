import shutil
import os
import hashlib
from pathlib import Path

def zip_product():
    source_dir = Path("database-migration-kit")
    output_filename = "database-migration-kit-v1.0.0"

    # Create zip
    shutil.make_archive(output_filename, 'zip', root_dir='.', base_dir='database-migration-kit')

    # Calculate checksum
    zip_path = Path(f"{output_filename}.zip")
    if zip_path.exists():
        sha256_hash = hashlib.sha256()
        with open(zip_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        checksum_path = Path(f"{output_filename}.zip.sha256")
        checksum_path.write_text(f"{sha256_hash.hexdigest()}  {zip_path.name}\n")

        print(f"Created {zip_path.name}")
        print(f"Created {checksum_path.name}")
    else:
        print("Failed to create zip file")

if __name__ == "__main__":
    zip_product()
