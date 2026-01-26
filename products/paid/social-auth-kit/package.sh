#!/bin/bash

# Social Auth Kit Packaging Script

PRODUCT_NAME="social-auth-kit"
VERSION="1.0.0"
OUTPUT_DIR="dist"
ZIP_NAME="${PRODUCT_NAME}-v${VERSION}.zip"

echo "📦 Packaging $PRODUCT_NAME v$VERSION..."

# Clean up previous build
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR/$PRODUCT_NAME

# Copy Backend
echo "-> Copying Backend..."
mkdir -p $OUTPUT_DIR/$PRODUCT_NAME/backend

# Copy directories excluding cache and temporary files
rsync -av --exclude='__pycache__' --exclude='*.pyc' --exclude='.pytest_cache' --exclude='.env' backend/app $OUTPUT_DIR/$PRODUCT_NAME/backend/
rsync -av --exclude='__pycache__' --exclude='*.pyc' --exclude='.pytest_cache' backend/tests $OUTPUT_DIR/$PRODUCT_NAME/backend/
rsync -av --exclude='__pycache__' --exclude='*.pyc' backend/alembic $OUTPUT_DIR/$PRODUCT_NAME/backend/

cp backend/alembic.ini $OUTPUT_DIR/$PRODUCT_NAME/backend/
cp backend/Dockerfile $OUTPUT_DIR/$PRODUCT_NAME/backend/
cp backend/pyproject.toml $OUTPUT_DIR/$PRODUCT_NAME/backend/
cp backend/.env.example $OUTPUT_DIR/$PRODUCT_NAME/backend/

# Copy Frontend Examples
echo "-> Copying Frontend Examples..."
rsync -av --exclude='node_modules' --exclude='.next' --exclude='dist' frontend-examples $OUTPUT_DIR/$PRODUCT_NAME/

# Copy Docs & Root files
echo "-> Copying Documentation..."
cp -r docs $OUTPUT_DIR/$PRODUCT_NAME/
cp README.md $OUTPUT_DIR/$PRODUCT_NAME/
cp LICENSE $OUTPUT_DIR/$PRODUCT_NAME/
cp docker-compose.yml $OUTPUT_DIR/$PRODUCT_NAME/
cp .gitignore $OUTPUT_DIR/$PRODUCT_NAME/

# Create Zip
echo "-> Zipping..."
cd $OUTPUT_DIR
zip -r $ZIP_NAME $PRODUCT_NAME
cd ..

echo "✅ Package created: $OUTPUT_DIR/$ZIP_NAME"
ls -lh $OUTPUT_DIR/$ZIP_NAME
