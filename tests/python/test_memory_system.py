#!/usr/bin/env python3
"""
Test script to check the memory system functionality
"""

def test_memory_imports():
    print("Testing individual imports...")

    # Test importing the packages
    try:
        import mem0  # noqa: F401 - availability check
        print("✓ Successfully imported mem0")
    except ImportError as e:
        print(f"✗ Failed to import mem0  # noqa: F401 - availability check: {e}")

    try:
        from mem0 import Memory as Mem0Memory  # noqa: F401 - availability check
        print("✓ Successfully imported Mem0Memory from mem0")
    except ImportError as e:
        print(f"✗ Failed to import Mem0Memory from mem0: {e}")

    try:
        import qdrant_client  # noqa: F401 - availability check
        print("✓ Successfully imported qdrant_client")
    except ImportError as e:
        print(f"✗ Failed to import qdrant_client  # noqa: F401 - availability check: {e}")

    # Test the memory facade directly
    print("\nTesting memory facade...")
    try:
        from packages.memory.memory_facade import MemoryFacade
        print("✓ Successfully imported MemoryFacade")

        # Create instance and test connection
        facade = MemoryFacade()
        connection_result = facade.connect()
        print(f"Connection result: {connection_result}")

        status = facade.get_provider_status()
        print(f"Memory System Status: {status}")

        return facade

    except Exception as e:
        print(f"✗ Error creating MemoryFacade: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_qdrant_directly():
    print("\nTesting Qdrant connection directly...")
    try:
        from packages.memory.qdrant_provider import QdrantProvider
        provider = QdrantProvider()
        print(f"QdrantProvider created: {provider}")

        # Check if qdrant is available
        import packages.memory.qdrant_provider as qp
        print(f"QDRANT_AVAILABLE: {qp.QDRANT_AVAILABLE}")

    except Exception as e:
        print(f"Error with QdrantProvider: {e}")
        import traceback
        traceback.print_exc()

def test_mem0_directly():
    print("\nTesting Mem0 client directly...")
    try:
        from packages.memory.mem0_client import Mem0Client
        client = Mem0Client()
        print(f"Mem0Client created: {client}")

        # Check if mem0 is available
        import packages.memory.mem0_client as mc
        print(f"MEM0_AVAILABLE: {mc.MEM0_AVAILABLE}")

    except Exception as e:
        print(f"Error with Mem0Client: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting memory system tests...\n")
    test_memory_imports()
    test_qdrant_directly()
    test_mem0_directly()
    print("\nTests completed.")