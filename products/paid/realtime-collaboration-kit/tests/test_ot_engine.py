import pytest
from backend.ot_engine import OTEngine, Operation, OpType

class TestOTEngine:

    def test_apply_insert(self):
        doc = "Hello"
        op = Operation(OpType.INSERT, position=5, value=" World")
        result = OTEngine.apply(doc, op)
        assert result == "Hello World"

    def test_apply_delete(self):
        doc = "Hello World"
        op = Operation(OpType.DELETE, position=5, length=6)
        result = OTEngine.apply(doc, op)
        assert result == "Hello"

    def test_apply_insert_middle(self):
        doc = "Hello World"
        op = Operation(OpType.INSERT, position=5, value=",")
        result = OTEngine.apply(doc, op)
        assert result == "Hello, World"

    def test_transform_insert_insert_before(self):
        # Initial: "123"
        # A: Ins "A" at 1 -> "1A23"
        # B: Ins "B" at 2 -> "12B3"

        op_a = Operation(OpType.INSERT, position=1, value="A")
        op_b = Operation(OpType.INSERT, position=2, value="B")

        # Transform A against B
        # A happened first effectively or concurrent.

        a_prime, b_prime = OTEngine.transform(op_a, op_b)

        # If we apply A then B_prime:
        # "123" -> "1A23"
        # b_prime should account for A's insertion (len 1).
        # B was at 2. Now at 2+1 = 3.
        assert b_prime.position == 3

        # If we apply B then A_prime:
        # "123" -> "12B3"
        # A was at 1. B was at 2. A is before B.
        # A should not change position.
        assert a_prime.position == 1

    def test_transform_insert_insert_after(self):
        op_a = Operation(OpType.INSERT, position=2, value="A")
        op_b = Operation(OpType.INSERT, position=1, value="B")

        a_prime, b_prime = OTEngine.transform(op_a, op_b)

        # Apply B then A_prime
        # B inserts at 1.
        # A (at 2) needs to shift to 3.
        assert a_prime.position == 3

        # Apply A then B_prime
        # A inserts at 2.
        # B (at 1) is before A. No shift.
        assert b_prime.position == 1

    def test_transform_insert_delete_before(self):
        # A: Ins "A" at 2
        # B: Del 1 char at 0
        op_a = Operation(OpType.INSERT, position=2, value="A")
        op_b = Operation(OpType.DELETE, position=0, length=1)

        a_prime, b_prime = OTEngine.transform(op_a, op_b)

        # B deletes before A. A must shift left.
        assert a_prime.position == 1

        # A inserts after B. B is unaffected position-wise (applied to original).
        assert b_prime.position == 0
