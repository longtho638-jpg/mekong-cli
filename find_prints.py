import os
import re

def find_prints_not_in_main(root_dir):
    results = []
    # Match print( exactly, ensuring it's not part of another word like 'sprint'
    # and not at the beginning of a word like 'blueprint'
    print_regex = re.compile(r'(?<![a-zA-Z0-9_])print\s*\(')

    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r') as f:
                        lines = f.readlines()

                    in_main = False
                    for i, line in enumerate(lines):
                        # Detect main block
                        if 'if __name__ == "__main__":' in line or "if __name__ == '__main__':" in line:
                            in_main = True

                        if print_regex.search(line) and not in_main:
                            stripped = line.strip()
                            if stripped.startswith('#'):
                                continue

                            # Skip UI methods
                            is_ui_method = False
                            for j in range(i, max(-1, i-20), -1):
                                if 'def ' in lines[j] and any(x in lines[j] for x in ['print_', 'show_', 'format_', 'report', 'dashboard', 'banner']):
                                    is_ui_method = True
                                    break

                            if not is_ui_method:
                                results.append(f"{filepath}:{i+1}:{stripped}")
                except Exception:
                    continue
    return results

if __name__ == "__main__":
    dirs = ['backend', 'antigravity']
    for d in dirs:
        if os.path.exists(d):
            for p in find_prints_not_in_main(d):
                print(p)
