"""Tests for RAG Engine"""

import shutil
import sys
from pathlib import Path

# Add agi-sops root to path for imports when running from mekong-cli root
AGI_SOPS_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(AGI_SOPS_ROOT))

import pytest  # noqa: E402

from src.core.models import SOP, SOPStep  # noqa: E402
from src.rag.retriever import RAGEngine  # noqa: E402


class TestRAGEngine:
    """Test RAG Engine"""

    @pytest.fixture
    def temp_db(self, tmp_path):
        """Create temporary database directory"""
        db_path = tmp_path / "lancedb"
        yield str(db_path)
        # Cleanup
        if db_path.exists():
            shutil.rmtree(db_path, ignore_errors=True)

    @pytest.fixture
    def sample_sop(self):
        """Create sample SOP for testing"""
        return SOP(
            name="deploy-app",
            version="1.0.0",
            description="Deploy application to production",
            steps=[
                SOPStep(id="build", command="npm run build"),
                SOPStep(id="test", command="npm test"),
                SOPStep(id="push", command="git push origin main"),
            ],
        )

    def test_index_sop(self, temp_db, sample_sop):
        """Test SOP indexing"""
        rag = RAGEngine(db_path=temp_db)

        # Index SOP
        rag.index_sop(sample_sop)

        # Verify index exists
        db = rag._get_db()
        tables = db.list_tables()
        table_names = tables.tables if hasattr(tables, 'tables') else tables
        assert "sops_deploy_app" in table_names

    def test_search_sops(self, temp_db, sample_sop):
        """Test SOP search"""
        rag = RAGEngine(db_path=temp_db)

        # Index multiple SOPs
        rag.index_sop(sample_sop)

        sop2 = SOP(
            name="test-app",
            version="1.0.0",
            description="Run tests for application",
            steps=[SOPStep(id="test", command="npm test")],
        )
        rag.index_sop(sop2)

        # Search
        results = rag.search("deploy production", limit=5)

        # Should find deploy-app SOP
        assert len(results) > 0
        assert any("deploy-app" in str(r.get("name", "")) for r in results)

    def test_search_empty(self, temp_db):
        """Test search with no indexed SOPs"""
        rag = RAGEngine(db_path=temp_db)

        results = rag.search("deploy", limit=5)

        assert len(results) == 0

    def test_delete_index(self, temp_db, sample_sop):
        """Test deleting SOP index"""
        rag = RAGEngine(db_path=temp_db)

        # Index and delete
        rag.index_sop(sample_sop)
        rag.delete_index("deploy-app")

        # Verify index deleted
        db = rag._get_db()
        tables = db.list_tables()
        table_names = tables.tables if hasattr(tables, 'tables') else tables
        assert "sops_deploy_app" not in table_names


class TestRAGEngineIntegration:
    """Integration tests requiring actual dependencies"""

    @pytest.mark.skip(reason="Requires lancedb and sentence-transformers")
    def test_full_indexing_pipeline(self, tmp_path):
        """Test full indexing and search pipeline"""
        db_path = tmp_path / "lancedb"
        rag = RAGEngine(db_path=str(db_path))

        # Create test SOPs
        sops = [
            SOP(name="sop-1", version="1.0.0", description="First SOP",
                steps=[SOPStep(id="s1", command="echo 1")]),
            SOP(name="sop-2", version="1.0.0", description="Second SOP",
                steps=[SOPStep(id="s1", command="echo 2")]),
        ]

        # Index all
        for sop in sops:
            rag.index_sop(sop)

        # Search
        results = rag.search("first", limit=1)

        assert len(results) == 1
        assert "sop-1" in results[0].get("name", "")
