import pytest
from unittest.mock import MagicMock, patch
from antigravity.core.knowledge.graph_client import GraphClient, KnowledgeNode, KnowledgeEdge
from antigravity.core.knowledge.schema import IngestionSchema

class TestGraphClient:
    @patch("antigravity.core.knowledge.graph_client.FalkorDB")
    def test_add_node(self, mock_falkordb_class):
        # Mock FalkorDB driver instance
        mock_driver = MagicMock()
        mock_graph = MagicMock()

        # Setup the mock chain: FalkorDB() -> driver, driver.select_graph() -> graph
        mock_falkordb_class.return_value = mock_driver
        mock_driver.select_graph.return_value = mock_graph

        # Instantiating GraphClient will now use the mock class
        client = GraphClient(host="mock", port=0)

        # Verify driver setup
        mock_falkordb_class.assert_called_with(host="mock", port=0)
        mock_driver.select_graph.assert_called_with("agencyos")

        node = KnowledgeNode(label="Test", name="test_node", properties={"a": 1})
        client.add_node(node)

        mock_graph.query.assert_called_once()
        # Updated assertion for parameterized query
        args = mock_graph.query.call_args[0]
        assert "MERGE (n:Test {name: $name})" in args[0]
        assert args[1]["name"] == "test_node"

    def test_schema_generation(self):
        node = IngestionSchema.file_node("test.py", "python")
        assert node.label == "File"
        assert node.name == "test.py"
        assert node.properties["type"] == "python"

    def test_function_node(self):
        node = IngestionSchema.function_node("main", "test.py", "main()")
        assert node.label == "Function"
        assert node.name == "test.py::main"

    def test_edge_creation(self):
        edge = IngestionSchema.dependency_edge("source", "target")
        assert edge.source_name == "source"
        assert edge.target_name == "target"
        assert edge.relation == "DEPENDS_ON"
