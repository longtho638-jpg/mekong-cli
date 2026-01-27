# CC CLI Input Rules - LUẬT BẮT BUỘC

> **KHÔNG ĐƯỢC QUÊN - Áp dụng mọi lần send_command_input tới CC CLI**

## Rule 1: LUÔN GỬI 2 LỆNH RIÊNG BIỆT

```xml
<!-- LỆNH 1: Gửi command/response -->
<invoke name="send_command_input">
<parameter name="Input">/command hoặc số</parameter>
</invoke>

<!-- LỆNH 2: Gửi ENTER (empty với newline) -->
<invoke name="send_command_input">
<parameter name="Input">
</parameter>
</invoke>
```

**LÝ DO:** CC CLI cần ENTER riêng mới thực thi.

## Rule 2: LUÔN DÙNG /COMMAND FORMAT

Khi tương tác với CC CLI từ claudekit:

```
✅ ĐÚNG: /binh-phap next + ENTER
✅ ĐÚNG: /approve + ENTER
✅ ĐÚNG: /delegate "task" + ENTER

❌ SAI: Chỉ gõ "1" mà không có /command
❌ SAI: Gõ text thuần túy
```

**Ngoại lệ:** Khi CC CLI chờ input số (1/2/3), có thể gửi số nhưng VẪN PHẢI CÓ ENTER RIÊNG.

## Rule 3: QUY TRÌNH ĐẦY ĐỦ

1. **GỬI** - `send_command_input` với /command hoặc response
2. **ENTER** - `send_command_input` với Input = `\n` (dòng trống)
3. **GIÁM SÁT** - Dùng `command_status` chờ output
4. **TIẾP TỤC** - Chỉ khi confirm done mới chuyển task

## Ví Dụ Hoàn Chỉnh

```xml
<!-- Bước 1: Gửi command -->
<invoke name="send_command_input">
<parameter name="Input">/binh-phap next</parameter>
<parameter name="WaitMs">3000</parameter>
</invoke>

<!-- Bước 2: Gửi ENTER -->
<invoke name="send_command_input">
<parameter name="Input">
</parameter>
<parameter name="WaitMs">5000</parameter>
</invoke>

<!-- Bước 3: Kiểm tra output -->
<invoke name="command_status">
<parameter name="CommandId">xxx</parameter>
<parameter name="WaitDurationSeconds">60</parameter>
</invoke>
```

---

**Cập nhật:** 2026-01-26
**Bởi:** Chairman Long chỉnh đốn
