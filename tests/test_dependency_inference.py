"""Tests for DependencyInference module.

Covers:
- StepIO extraction for file, package, env, git patterns
- Multi-step dependency inference (producer → consumer matching)
- merge_dependencies (union, explicit preserved)
"""

from __future__ import annotations

from src.core.dependency_inference import DependencyInference
from src.core.parser import RecipeStep


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_step(order: int, title: str = "", description: str = "", deps: list[int] | None = None) -> RecipeStep:
    return RecipeStep(
        order=order,
        title=title,
        description=description,
        dependencies=deps or [],
    )


# ---------------------------------------------------------------------------
# extract_io — file I/O
# ---------------------------------------------------------------------------

class TestExtractFileIO:
    def setup_method(self):
        self.di = DependencyInference()

    def test_redirect_produces_file(self):
        step = make_step(1, description="echo hello > output.txt")
        io = self.di.extract_io(step)
        assert "file:output.txt" in io.produces

    def test_double_redirect_produces_file(self):
        step = make_step(1, description="cat log.txt >> output.txt")
        io = self.di.extract_io(step)
        assert "file:output.txt" in io.produces

    def test_create_keyword_produces_file(self):
        step = make_step(1, description="create config.yaml with settings")
        io = self.di.extract_io(step)
        assert "file:config.yaml" in io.produces

    def test_write_keyword_produces_file(self):
        step = make_step(1, description="write results.json to disk")
        io = self.di.extract_io(step)
        assert "file:results.json" in io.produces

    def test_cat_consumes_file(self):
        step = make_step(1, description="cat config.yaml")
        io = self.di.extract_io(step)
        assert "file:config.yaml" in io.consumes

    def test_read_consumes_file(self):
        step = make_step(1, description="read output.txt and process it")
        io = self.di.extract_io(step)
        assert "file:output.txt" in io.consumes

    def test_cp_produces_dest_consumes_src(self):
        step = make_step(1, description="cp source.py dest.py")
        io = self.di.extract_io(step)
        assert "file:source.py" in io.consumes
        assert "file:dest.py" in io.produces

    def test_unrelated_step_no_file_io(self):
        step = make_step(1, description="run unit tests")
        io = self.di.extract_io(step)
        assert not any(t.startswith("file:") for t in io.produces)
        assert not any(t.startswith("file:") for t in io.consumes)


# ---------------------------------------------------------------------------
# extract_io — package I/O
# ---------------------------------------------------------------------------

class TestExtractPkgIO:
    def setup_method(self):
        self.di = DependencyInference()

    def test_pip_install_produces_pkg(self):
        step = make_step(1, description="pip install requests")
        io = self.di.extract_io(step)
        assert "pkg:requests" in io.produces

    def test_pip3_install_produces_pkg(self):
        step = make_step(1, description="pip3 install numpy")
        io = self.di.extract_io(step)
        assert "pkg:numpy" in io.produces

    def test_npm_install_produces_pkg(self):
        step = make_step(1, description="npm install express")
        io = self.di.extract_io(step)
        assert "pkg:express" in io.produces

    def test_import_consumes_pkg(self):
        step = make_step(1, description="import requests\nimport json")
        io = self.di.extract_io(step)
        assert "pkg:requests" in io.consumes
        assert "pkg:json" in io.consumes

    def test_from_import_consumes_top_level_pkg(self):
        step = make_step(1, description="from pathlib import Path")
        io = self.di.extract_io(step)
        assert "pkg:pathlib" in io.consumes

    def test_from_submodule_uses_top_level(self):
        step = make_step(1, description="from src.core.parser import RecipeStep")
        io = self.di.extract_io(step)
        assert "pkg:src" in io.consumes


# ---------------------------------------------------------------------------
# extract_io — environment variables
# ---------------------------------------------------------------------------

class TestExtractEnvIO:
    def setup_method(self):
        self.di = DependencyInference()

    def test_export_produces_env_var(self):
        step = make_step(1, description="export API_KEY=abc123")
        io = self.di.extract_io(step)
        assert "env:API_KEY" in io.produces

    def test_dollar_var_consumes_env_var(self):
        step = make_step(1, description="curl -H $API_KEY https://example.com")
        io = self.di.extract_io(step)
        assert "env:API_KEY" in io.consumes

    def test_brace_var_consumes_env_var(self):
        step = make_step(1, description="echo ${DATABASE_URL}")
        io = self.di.extract_io(step)
        assert "env:DATABASE_URL" in io.consumes

    def test_no_false_positive_lowercase_var(self):
        step = make_step(1, description="echo $path is invalid")
        io = self.di.extract_io(step)
        # lowercase $path should not match [A-Z_][A-Z0-9_]*
        assert "env:path" not in io.consumes


# ---------------------------------------------------------------------------
# extract_io — git state
# ---------------------------------------------------------------------------

class TestExtractGitIO:
    def setup_method(self):
        self.di = DependencyInference()

    def test_git_add_produces_staged(self):
        step = make_step(1, description="git add .")
        io = self.di.extract_io(step)
        assert "git:staged" in io.produces

    def test_git_commit_consumes_staged_produces_commit(self):
        step = make_step(1, description="git commit -m 'feat: add feature'")
        io = self.di.extract_io(step)
        assert "git:staged" in io.consumes
        assert "git:commit" in io.produces

    def test_git_push_consumes_commit(self):
        step = make_step(1, description="git push origin main")
        io = self.di.extract_io(step)
        assert "git:commit" in io.consumes

    def test_unrelated_git_command_no_state(self):
        step = make_step(1, description="git status")
        io = self.di.extract_io(step)
        assert not io.produces
        assert not io.consumes


# ---------------------------------------------------------------------------
# infer_dependencies
# ---------------------------------------------------------------------------

class TestInferDependencies:
    def setup_method(self):
        self.di = DependencyInference()

    def test_file_write_then_read_infers_dep(self):
        steps = [
            make_step(1, description="echo hello > output.txt"),
            make_step(2, description="cat output.txt"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert 1 in inferred[2]

    def test_pip_install_then_import_infers_dep(self):
        steps = [
            make_step(1, description="pip install requests"),
            make_step(2, description="import requests\nresponse = requests.get(url)"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert 1 in inferred[2]

    def test_export_then_use_env_var_infers_dep(self):
        steps = [
            make_step(1, description="export DATABASE_URL=postgres://localhost/db"),
            make_step(2, description="psql $DATABASE_URL -c 'SELECT 1'"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert 1 in inferred[2]

    def test_git_add_commit_push_chain(self):
        steps = [
            make_step(1, description="git add ."),
            make_step(2, description="git commit -m 'feat: new'"),
            make_step(3, description="git push origin main"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert 1 in inferred[2]
        assert 2 in inferred[3]

    def test_no_false_positive_unrelated_steps(self):
        steps = [
            make_step(1, description="run unit tests"),
            make_step(2, description="deploy to production"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert inferred[2] == []

    def test_step_does_not_depend_on_itself(self):
        steps = [make_step(1, description="export VAR=x; echo $VAR")]
        inferred = self.di.infer_dependencies(steps)
        assert 1 not in inferred[1]

    def test_no_backward_dep(self):
        """Later step cannot infer dep on a step that comes after it."""
        steps = [
            make_step(1, description="cat output.txt"),
            make_step(2, description="echo hello > output.txt"),
        ]
        inferred = self.di.infer_dependencies(steps)
        # Step 1 cannot depend on step 2 (step 2 is later)
        assert 2 not in inferred[1]

    def test_multi_step_file_chain(self):
        """A → B → C where A writes file, B transforms it, C reads it."""
        steps = [
            make_step(1, description="generate report.csv"),
            make_step(2, description="cat report.csv > summary.txt"),
            make_step(3, description="read summary.txt and send email"),
        ]
        inferred = self.di.infer_dependencies(steps)
        assert 1 in inferred[2]
        assert 2 in inferred[3]


# ---------------------------------------------------------------------------
# merge_dependencies
# ---------------------------------------------------------------------------

class TestMergeDependencies:
    def setup_method(self):
        self.di = DependencyInference()

    def test_adds_inferred_deps_to_empty_deps(self):
        step = make_step(2, deps=[])
        self.di.merge_dependencies([step], {2: [1]})
        assert 1 in step.dependencies

    def test_preserves_explicit_deps(self):
        step = make_step(3, deps=[1])
        self.di.merge_dependencies([step], {3: [2]})
        assert 1 in step.dependencies
        assert 2 in step.dependencies

    def test_no_duplicate_deps(self):
        step = make_step(2, deps=[1])
        self.di.merge_dependencies([step], {2: [1]})
        assert step.dependencies.count(1) == 1

    def test_no_change_when_no_inferred(self):
        step = make_step(2, deps=[1])
        self.di.merge_dependencies([step], {2: []})
        assert step.dependencies == [1]

    def test_syncs_params_dependencies(self):
        step = make_step(2, deps=[])
        step.params["dependencies"] = []
        self.di.merge_dependencies([step], {2: [1]})
        assert 1 in step.params["dependencies"]

    def test_params_not_modified_if_key_absent(self):
        """If params has no 'dependencies' key, it should not be added."""
        step = make_step(2, deps=[])
        step.params = {}
        self.di.merge_dependencies([step], {2: [1]})
        assert "dependencies" not in step.params

    def test_multiple_steps_merged_independently(self):
        steps = [make_step(1, deps=[]), make_step(2, deps=[]), make_step(3, deps=[])]
        inferred = {1: [], 2: [1], 3: [1, 2]}
        self.di.merge_dependencies(steps, inferred)
        assert steps[0].dependencies == []
        assert steps[1].dependencies == [1]
        assert 1 in steps[2].dependencies
        assert 2 in steps[2].dependencies


# ---------------------------------------------------------------------------
# Integration: full infer + merge pipeline
# ---------------------------------------------------------------------------

class TestFullPipeline:
    def setup_method(self):
        self.di = DependencyInference()

    def test_install_import_pipeline(self):
        steps = [
            make_step(1, title="Install deps", description="pip install flask"),
            make_step(2, title="Run app", description="from flask import Flask\napp = Flask(__name__)"),
        ]
        inferred = self.di.infer_dependencies(steps)
        self.di.merge_dependencies(steps, inferred)
        assert 1 in steps[1].dependencies

    def test_git_workflow_pipeline(self):
        steps = [
            make_step(1, title="Stage files", description="git add ."),
            make_step(2, title="Commit", description="git commit -m 'chore: update'"),
            make_step(3, title="Push", description="git push origin main"),
        ]
        inferred = self.di.infer_dependencies(steps)
        self.di.merge_dependencies(steps, inferred)
        assert 1 in steps[1].dependencies
        assert 2 in steps[2].dependencies

    def test_explicit_deps_not_overridden(self):
        """Explicit dep [5] is preserved even if inference would add [1]."""
        steps = [
            make_step(1, description="pip install numpy"),
            make_step(2, description="import numpy as np", deps=[5]),
        ]
        inferred = self.di.infer_dependencies(steps)
        self.di.merge_dependencies(steps, inferred)
        # Both explicit dep and inferred dep should be present
        assert 5 in steps[1].dependencies
        assert 1 in steps[1].dependencies
