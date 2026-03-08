"""Tests for build command"""

from unittest.mock import patch, MagicMock
import sys
from src.commands.build import clean_build, build_python_package, build_js_frontend, build_docker_image


def test_clean_build():
    """Test that clean_build removes specified directories and files"""
    with patch("src.commands.build.Path") as mock_path:
        # Mock the Path.glob method to return some paths
        mock_dir1 = MagicMock()
        mock_dir1.is_dir.return_value = True
        mock_dir1.is_file.return_value = False

        mock_file1 = MagicMock()
        mock_file1.is_dir.return_value = False
        mock_file1.is_file.return_value = True

        mock_path.return_value.glob.return_value = [mock_dir1, mock_file1]

        with patch("src.commands.build.shutil") as mock_shutil:
            clean_build()

            # Check that rmtree and unlink were called (we don't care how many times)
            assert mock_shutil.rmtree.called
            assert mock_file1.unlink.called


def test_build_python_package():
    """Test that build_python_package calls poetry build"""
    with patch("src.commands.build.subprocess.run") as mock_run, \
         patch("src.commands.build.Path") as mock_path:

        # Mock dist directory exists and has files
        mock_dist = MagicMock()
        mock_dist.exists.return_value = True
        mock_file = MagicMock()
        mock_file.name = "test-package-0.1.0.tar.gz"
        mock_file.stat.return_value.st_size = 1024
        mock_dist.iterdir.return_value = [mock_file]

        mock_path.return_value = mock_dist

        build_python_package(verbose=True)

        mock_run.assert_called_once()
        args, _ = mock_run.call_args
        assert args[0][:4] == [sys.executable, "-m", "poetry", "build"]


def test_build_js_frontend_no_package_json():
    """Test that build_js_frontend skips if package.json not found"""
    with patch("src.commands.build.Path") as mock_path:
        mock_path.return_value.exists.return_value = False

        build_js_frontend(verbose=True)


def test_build_js_frontend_with_npm():
    """Test that build_js_frontend calls npm run build"""
    with patch("src.commands.build.Path") as mock_path, \
         patch("src.commands.build.subprocess.run") as mock_run:

        mock_path.return_value.exists.return_value = True

        build_js_frontend(verbose=True)

        mock_run.assert_called_once()
        args, _ = mock_run.call_args
        assert args[0] == ["npm", "run", "build"]


def test_build_docker_image_no_dockerfile():
    """Test that build_docker_image skips if Dockerfile not found"""
    with patch("src.commands.build.Path") as mock_path:
        mock_path.return_value.exists.return_value = False

        build_docker_image(verbose=True)


def test_build_docker_image_with_docker():
    """Test that build_docker_image calls docker build"""
    with patch("src.commands.build.Path") as mock_path, \
         patch("src.commands.build.subprocess.run") as mock_run:

        mock_path.return_value.exists.return_value = True

        build_docker_image(verbose=True)

        mock_run.assert_called_once()
        args, _ = mock_run.call_args
        assert args[0][:3] == ["docker", "build", "-t"]
