import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from backend.ot_engine import OTEngine, Operation, OpType

def verify_ot():
    print("Verifying OT Engine...")

    # Test 1: Insert
    doc = "Hello"
    op = Operation(OpType.INSERT, position=5, value=" World")
    res = OTEngine.apply(doc, op)
    assert res == "Hello World", f"Test 1 Failed: {res}"
    print("Test 1 (Insert) Passed")

    # Test 2: Delete
    doc = "Hello World"
    op = Operation(OpType.DELETE, position=5, length=6)
    res = OTEngine.apply(doc, op)
    assert res == "Hello", f"Test 2 (Delete) Failed: {res}"
    print("Test 2 (Delete) Passed")

    # Test 3: Transform (Insert vs Insert)
    # A: Ins "A" at 1 -> "1A23"
    # B: Ins "B" at 2 -> "12B3"
    op_a = Operation(OpType.INSERT, position=1, value="A")
    op_b = Operation(OpType.INSERT, position=2, value="B")

    a_prime, b_prime = OTEngine.transform(op_a, op_b)

    # Apply A then B_prime
    # "123" -> "1A23" (len 4). B was at 2. Should be at 3 (2 + len(A)=1)
    assert b_prime.position == 3, f"Test 3 (B_prime pos) Failed: {b_prime.position}"

    # Apply B then A_prime
    # "123" -> "12B3". A was at 1. Should stay 1.
    assert a_prime.position == 1, f"Test 3 (A_prime pos) Failed: {a_prime.position}"
    print("Test 3 (Transform I/I) Passed")

    print("All OT Engine tests passed!")

if __name__ == "__main__":
    verify_ot()
