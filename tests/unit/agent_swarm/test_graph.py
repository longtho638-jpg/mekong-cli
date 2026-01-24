import pytest
import time
from antigravity.core.agent_swarm.engine import AgentSwarm
from antigravity.core.agent_swarm.graph import GraphExecutor, GraphWorkflow, GraphNode
from antigravity.core.agent_swarm.enums import TaskStatus

def test_graph_execution():
    # 1. Setup Swarm
    swarm = AgentSwarm(max_workers=4, enable_metrics=False)
    executor = GraphExecutor(swarm)

    # 2. Register Agent
    def processor(payload):
        time.sleep(0.2)
        if isinstance(payload, dict) and "input_data" in payload:
            return f"Processed {payload['input_data']}"
        return f"Processed {payload}"

    swarm.register_agent("worker", processor)
    swarm.start()

    try:
        # 3. Define Workflow (Diamond Pattern)
        #   A
        #  / \
        # B   C
        #  \ /
        #   D

        wf = GraphWorkflow(id="wf-1", name="Diamond Test")

        node_a = GraphNode(id="A", task_name="Task A", payload="Start")
        node_b = GraphNode(id="B", task_name="Task B", payload={"use_output_from": "A"})
        node_c = GraphNode(id="C", task_name="Task C", payload={"use_output_from": "A"})
        node_d = GraphNode(id="D", task_name="Task D", payload="Final Step") # Doesn't actually use B/C output in this simple test logic, just waits

        wf.add_node(node_a)
        wf.add_node(node_b)
        wf.add_node(node_c)
        wf.add_node(node_d)

        wf.add_dependency("B", "A")
        wf.add_dependency("C", "A")
        wf.add_dependency("D", "B")
        wf.add_dependency("D", "C")

        # 4. Execute
        executor.execute_workflow(wf)

        # 5. Wait for completion (Simple polling for test)
        timeout = 20
        start = time.time()
        while any(n.status != TaskStatus.COMPLETED for n in wf.nodes.values()):
            if time.time() - start > timeout:
                # Print debug info before raising
                for nid, n in wf.nodes.items():
                    print(f"Node {nid}: status={n.status}, task_id={n.task_id}")
                raise TimeoutError("Workflow timed out")
            time.sleep(0.5)

        # 6. Verify Results
        assert wf.nodes["A"].result == "Processed Start"
        assert wf.nodes["B"].result == "Processed Processed Start"
        assert wf.nodes["C"].result == "Processed Processed Start"
        # D runs after B and C are done
        assert wf.nodes["D"].status.value == "completed"

    finally:
        swarm.stop()

if __name__ == "__main__":
    test_graph_execution()
