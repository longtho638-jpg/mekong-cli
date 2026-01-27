# CC CLI Workflow Rules - LUẬT GIAO VIỆC CHO CC CLI

> **Ngày cập nhật:** 2026-01-26

## Quy Trình Giao Việc Cho CC CLI

### Bước 1: Lập Plan

```
/plan [mô tả task]
```

- CC CLI sẽ output plan chi tiết
- Agent (Antigravity) review plan

### Bước 2: Duyệt Plan

```
/approve [số option hoặc "yes"]
```

- Approve plan từ CC CLI
- Nếu cần sửa: yêu cầu CC CLI điều chỉnh

### Bước 3: Giao Từng Step Bằng /binh-phap

```
/binh-phap next
```

- CC CLI analyze strategic options
- Agent chọn option phù hợp
- `/approve [1-4]` để execute

### Bước 4: Monitor Loop

```
Giao việc → Theo dõi → Chọn phương án → Loop
```

- KHÔNG hỏi Chairman
- Tự động chọn option recommended
- Chỉ notify khi có decision cần Chairman

## Autonomous Monitor Rules

1. **KHÔNG RỜI MẮT** khỏi CC CLI
2. **command_status** liên tục với WaitDurationSeconds cao
3. **Tự động chọn** option recommended nếu clear
4. **Chỉ hỏi Chairman** khi:
    - Cần approval chi tiêu/deploy production
    - Multiple options có trade-offs lớn
    - Error cần human intervention

## Command Flow Chart

```
Agent → /plan task → CC CLI outputs plan
Agent → /approve → CC CLI executes
Agent → /binh-phap next → CC CLI strategic analysis
Agent → /approve [1-4] → CC CLI executes step
Agent → command_status → Monitor progress
→ Loop back to /binh-phap next
```

## Example Session

```xml
<!-- 1. Giao task -->
<invoke name="send_command_input">
<parameter name="Input">/plan Build AgencyOS Workspace Template
</parameter>
</invoke>

<!-- 2. ENTER -->
<invoke name="send_command_input">
<parameter name="Input">
</parameter>
</invoke>

<!-- 3. Wait for plan -->
<invoke name="command_status">
<parameter name="WaitDurationSeconds">120</parameter>
</invoke>

<!-- 4. Approve plan -->
<invoke name="send_command_input">
<parameter name="Input">/approve yes
</parameter>
</invoke>

<!-- 5. Strategic execution -->
<invoke name="send_command_input">
<parameter name="Input">/binh-phap next
</parameter>
</invoke>

<!-- 6. Select option (auto) -->
<invoke name="send_command_input">
<parameter name="Input">/approve 1
</parameter>
</invoke>

<!-- 7. Monitor and loop -->
```
