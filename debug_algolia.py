try:
    from algoliasearch.search_client import SearchClient
    print("Import successful")
except ImportError as e:
    print(f"Import failed: {e}")
    try:
        import algoliasearch
        print(f"algoliasearch package found: {algoliasearch.__file__}")
    except ImportError:
        print("algoliasearch package NOT found")
