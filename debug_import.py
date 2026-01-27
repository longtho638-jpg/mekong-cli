
try:
    print("Importing backend.db.session...")
    from backend.db.session import get_db
    print("Successfully imported get_db")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Other Error: {e}")

try:
    print("\nImporting backend.api.routers.user_preferences...")
    from backend.api.routers import user_preferences
    print("Successfully imported user_preferences")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Other Error: {e}")
