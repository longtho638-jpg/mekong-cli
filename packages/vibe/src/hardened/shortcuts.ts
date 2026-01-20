/**
 * 🛡️ VIBE Hardened - Keyboard Shortcuts
 */
export interface Shortcut {
    key: string;
    modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt')[];
    action: () => void;
    description: string;
}

export class ShortcutRegistry {
    private shortcuts: Map<string, Shortcut> = new Map();

    register(id: string, shortcut: Shortcut): void {
        this.shortcuts.set(id, shortcut);
    }

    unregister(id: string): void {
        this.shortcuts.delete(id);
    }

    handle(event: KeyboardEvent): void {
        const isInput = ['INPUT', 'TEXTAREA'].includes(
            (event.target as HTMLElement)?.tagName
        );
        if (isInput) return;

        for (const shortcut of this.shortcuts.values()) {
            const modMatch = shortcut.modifiers?.every(mod => {
                if (mod === 'cmd') return event.metaKey;
                if (mod === 'ctrl') return event.ctrlKey;
                if (mod === 'shift') return event.shiftKey;
                if (mod === 'alt') return event.altKey;
                return false;
            }) ?? true;

            if (modMatch && event.key.toLowerCase() === shortcut.key.toLowerCase()) {
                event.preventDefault();
                shortcut.action();
            }
        }
    }

    getAll(): Shortcut[] {
        return Array.from(this.shortcuts.values());
    }
}
