try:
    from supabase.lib.client_options import ClientOptions

    from supabase import Client
    print("supabase imports ok")
except ImportError as e:
    print(f"supabase import error: {e}")

try:
    import gotrue
    print("gotrue imported")
except ImportError:
    print("gotrue not found")

try:
    from supabase_auth.errors import AuthApiError
    print("AuthApiError found in supabase_auth.errors")
except ImportError:
    print("AuthApiError NOT found in supabase_auth.errors")

try:
    from supabase.gotrue import AuthApiError
    print("AuthApiError found in supabase.gotrue")
except ImportError:
    print("AuthApiError NOT found in supabase.gotrue")
