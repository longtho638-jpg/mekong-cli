"""
DEPRECATED: This file is deprecated.

Use backend.api.config.settings instead.

Kept for backward compatibility only.
"""

import os
import warnings
from typing import List

# Import from new location
from backend.api.config.settings import Settings as NewSettings
from backend.api.config.settings import settings as new_settings

warnings.warn(
    "backend.api.config is deprecated. Use backend.api.config.settings instead.",
    DeprecationWarning,
    stacklevel=2
)


class Settings:
    """
    DEPRECATED: Backward compatibility wrapper.

    All new code should use backend.api.config.settings.Settings instead.
    """

    @property
    def PROJECT_NAME(self) -> str:
        return new_settings.project_name

    @property
    def VERSION(self) -> str:
        return new_settings.api_version

    @property
    def API_V1_STR(self) -> str:
        return new_settings.api_v1_str

    @property
    def SECRET_KEY(self) -> str:
        return new_settings.secret_key

    @property
    def ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        return new_settings.access_token_expire_minutes

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return new_settings.allowed_origins


settings = Settings()

