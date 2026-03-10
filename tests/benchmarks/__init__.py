"""Test benchmarks package."""

from .test_agi_tasks import (
    BENCHMARK_TASKS,
    run_benchmark,
    run_single_benchmark,
    BenchmarkTask,
)


def test_benchmark_string_reverse():
    """Benchmark: string reverse function (simple)."""
    task = BenchmarkTask(
        name="string_reverse",
        goal="Create a Python function to reverse a string with tests",
        expected_files=["reverse.py", "test_reverse.py"],
        expected_tests_pass=True,
        difficulty="simple",
        credits=1,
    )
    result = run_single_benchmark(task, max_retries=2)
    assert result is not None


def test_benchmark_fastapi_endpoint():
    """Benchmark: FastAPI endpoint (standard)."""
    task = BenchmarkTask(
        name="fastapi_users",
        goal="Create FastAPI endpoint GET /users with SQLite",
        expected_files=["main.py", "database.py"],
        expected_endpoint="/users",
        difficulty="standard",
        credits=3,
    )
    result = run_single_benchmark(task, max_retries=1)
    assert result is not None


def test_benchmark_jwt_auth():
    """Benchmark: JWT auth system (complex)."""
    task = BenchmarkTask(
        name="jwt_auth",
        goal="Create JWT auth system: register/login/refresh",
        expected_files=["auth.py", "models.py", "test_auth.py"],
        expected_coverage=70,
        difficulty="complex",
        credits=5,
    )
    result = run_single_benchmark(task, max_retries=1)
    assert result is not None


def test_benchmark_suite_quick():
    """Benchmark: run quick suite with 85% success rate target."""
    # Run only 1 task for quick validation
    report = run_benchmark(BENCHMARK_TASKS[:1], target_success_rate=0.85)
    assert report.total_tasks >= 1

