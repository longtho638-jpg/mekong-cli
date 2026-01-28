import inspect

import algoliasearch

print(f"Dir: {dir(algoliasearch)}")
try:
    from algoliasearch.search_client import SearchClient
    print("search_client.SearchClient found")
except ImportError:
    print("search_client.SearchClient NOT found")
    # Check if SearchClient is exposed directly
    if hasattr(algoliasearch, 'SearchClient'):
        print("algoliasearch.SearchClient found")
