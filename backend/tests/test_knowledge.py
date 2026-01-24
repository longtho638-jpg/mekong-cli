import ast
from antigravity.core.knowledge.graph_client import GraphClient, KnowledgeEdge, KnowledgeNode
from antigravity.core.knowledge.ingestor import CodeIngestor
from antigravity.core.knowledge.rag import KnowledgeRetriever
from antigravity.core.knowledge.schema import IngestionSchema
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


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

class TestCodeIngestor:
    def test_ingest_function(self):
        mock_client = MagicMock()
        ingestor = CodeIngestor(mock_client, "/tmp")

        # Mock AST node
        mock_node = MagicMock()
        mock_node.name = "my_func"
        mock_arg_x = MagicMock()
        mock_arg_x.arg = "x"
        mock_arg_y = MagicMock()
        mock_arg_y.arg = "y"
        mock_node.args.args = [mock_arg_x, mock_arg_y]

        ingestor._ingest_function(mock_node, "test.py")

        # Should add node and edge
        assert mock_client.add_node.called
        assert mock_client.add_edge.called

        # Verify node properties
        func_node = mock_client.add_node.call_args[0][0]
        assert func_node.label == "Function"
        assert "my_func" in func_node.name
        assert func_node.properties["signature"] == "my_func(x, y)"

    @patch("antigravity.core.knowledge.ingestor.Path.read_text")
    @patch("antigravity.core.knowledge.ingestor.ast.parse")
    def test_ingest_file(self, mock_ast_parse, mock_read_text):
        mock_client = MagicMock()
        ingestor = CodeIngestor(mock_client, "/tmp")

        mock_read_text.return_value = "def hello(): pass"
        mock_tree = MagicMock()
        mock_ast_parse.return_value = mock_tree

        # Mock ast.walk to yield a function def
        mock_func = MagicMock()
        mock_func.name = "hello"
        mock_func.args.args = []

        # Use PropertyMock for nested attributes if using spec,
        # but simpler to just use a class that looks like FunctionDef for isinstance
        class MockFunctionDef(ast.FunctionDef):
            def __init__(self, name, args_list):
                self.name = name
                self.args = MagicMock()
                self.args.args = [MagicMock(arg=a) for a in args_list]
                self.lineno = 1
                self.col_offset = 0

        mock_func = MockFunctionDef("hello", [])

        with patch("antigravity.core.knowledge.ingestor.ast.walk", return_value=[mock_func]):
            ingestor._ingest_file(Path("/tmp/test.py"))

        assert mock_client.add_node.call_count >= 2 # File node + Function node
        assert mock_client.add_edge.called

class TestKnowledgeRetriever:
    @patch("antigravity.core.knowledge.rag.get_model")
    def test_generate_embedding(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.encode.return_value = MagicMock(tolist=lambda: [0.1, 0.2, 0.3])
        mock_get_model.return_value = mock_model

        retriever = KnowledgeRetriever()
        embedding = retriever.generate_embedding("test text")

        assert embedding == [0.1, 0.2, 0.3]
        mock_model.encode.assert_called_once_with("test text")

    @patch("antigravity.core.knowledge.rag.graph_client")
    def test_search(self, mock_graph_client):
        mock_graph_client._graph = MagicMock()
        mock_graph_client.query.return_value = [] # Mock empty results for now

        retriever = KnowledgeRetriever()
        results = retriever.search("query")

        assert results == []
        mock_graph_client.query.assert_called_once()
        query_str, params = mock_graph_client.query.call_args[0], mock_graph_client.query.call_args[1].get("params")
        if not params and len(query_str) > 1:
            params = query_str[1]

        assert "CONTAINS $query" in query_str[0]
        assert params["query"] == "query"

class TestCodeIngestorBatch:
    @patch("antigravity.core.knowledge.ingest.graph_client")
    def test_sync_to_graph(self, mock_graph_client):
        from antigravity.core.knowledge.ingest import CodeIngestor
        from antigravity.core.knowledge.models import KnowledgeNode, NodeType

        mock_graph_client._graph = MagicMock()
        ingestor = CodeIngestor()

        # Add some mock nodes
        ingestor.nodes = [
            KnowledgeNode(id="test.py", type=NodeType.FILE, name="test.py")
        ]

        ingestor.sync_to_graph()

        assert mock_graph_client.query.called
        # Verify UNWIND query
        args = mock_graph_client.query.call_args_list[0]
        assert "UNWIND $nodes" in args[0][0]
        assert args[1]["params"]["nodes"][0]["id"] == "test.py"
