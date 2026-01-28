try:
    import gotrue
    print("gotrue imported")
except ImportError:
    print("gotrue NOT found")

try:
    from supabase import Client, create_client
    print("supabase imported")
    # client = create_client("url", "key")
    # print(type(client.auth))
except ImportError:
    print("supabase NOT found")

try:
    import supabase_auth
    print("supabase_auth imported")
except ImportError:
    print("supabase_auth NOT found")
