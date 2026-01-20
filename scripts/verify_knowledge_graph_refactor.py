"""
Verification script for Knowledge Graph Refactor.
"""
import logging
import os
import sys
import tempfile

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.knowledge_graph import (
    CodeEntity,
    EntityType,
    get_dependencies,
    get_knowledge_graph,
    index_codebase,
    search_code,
)


def verify_knowledge_graph():
    print("Testing Knowledge Graph Refactor...")

    # Create a temporary file to index
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write("""
import os
import json

class TestClass:
    '''Test docstring'''
    def test_method(self):
        pass

def test_function():
    return True
""")
        temp_path = f.name

    try:
        print(f"\n1. Indexing temporary file: {temp_path}")
        # Use the facade function
        kg = get_knowledge_graph()

        # We index specifically this file (using internal method via instance to target specific file if possible,
        # or just index the directory containing it)
        # The facade exposes index_codebase which takes a path.
        # Let's use index_directory on the temp file's directory, but filtering might be an issue if we don't control it.
        # Actually, let's use the instance method index_file directly if available on the facade instance?
        # The facade exports KnowledgeGraph class, so we can check if the instance has index_file.

        from pathlib import Path
        entities = kg.index_file(Path(temp_path))

        print(f"   Indexed {len(entities)} entities")

        if len(entities) == 0:
            print("❌ No entities indexed")
            return False

        # Check specific entities
        found_class = False
        found_func = False
        found_import = False

        for e in entities:
            print(f"   - {e.type.name}: {e.name}")
            if e.type == EntityType.CLASS and e.name == "TestClass":
                found_class = True
            if e.type == EntityType.FUNCTION and e.name == "test_function":
                found_func = True
            if e.type == EntityType.IMPORT and e.name == "os":
                found_import = True

        if not (found_class and found_func and found_import):
            print("❌ Missing expected entities")
            return False

        print("   Entities verified ✅")

        # 2. Test Search
        print("\n2. Testing Search...")
        # Add to search engine manually if index_file didn't do it?
        # index_file implementation in graph.py DOES add to search_engine.

        results = search_code("TestClass")
        print(f"   Search results for 'TestClass': {len(results)}")

        if len(results) == 0:
            print("❌ Search returned no results")
            return False

        if results[0].entity.name != "TestClass":
            print(f"❌ Top result mismatch: {results[0].entity.name}")
            return False

        print("   Search verified ✅")

        # 3. Test Dependencies
        print("\n3. Testing Dependencies...")
        deps = get_dependencies(temp_path)
        print(f"   Dependencies: {deps}")

        if "os" not in deps or "json" not in deps:
            print("❌ Missing dependencies")
            return False

        print("   Dependencies verified ✅")

        print("\n✅ Verification Successful!")
        return True

    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == "__main__":
    try:
        if verify_knowledge_graph():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
