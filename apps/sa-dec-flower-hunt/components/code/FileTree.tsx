"use client";

import { useState, useEffect } from "react";
import { Folder, File as FileIcon, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileEntry {
  name: string;
  type: "file" | "dir";
  path: string;
}

interface FileTreeProps {
  path?: string;
  onSelectFile: (path: string) => void;
  level?: number;
}

export function FileTree({ path = "", onSelectFile, level = 0 }: FileTreeProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchFiles() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/code/files?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (mounted && data.files) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error("Failed to fetch files", error);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFiles();
    return () => { mounted = false; };
  }, [path]);

  const toggleFolder = (folderPath: string) => {
    setExpanded((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  if (loading && level === 0) {
      return <div className="p-4 flex items-center gap-2 text-stone-500 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Loading workspace...</div>;
  }
  
  if (error && level === 0) {
      return <div className="p-4 text-red-500 text-sm">Failed to load file system.</div>;
  }

  return (
    <div className={cn("text-sm select-none", level > 0 && "ml-3 border-l border-stone-200 dark:border-stone-800")}>
      {files.length === 0 && !loading && level > 0 && (
          <div className="py-1 px-4 text-stone-400 text-xs italic">Empty</div>
      )}
      {files.map((file) => (
        <div key={file.path}>
          <div
            className={cn(
              "flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer transition-colors",
              "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (file.type === "dir") {
                toggleFolder(file.path);
              } else {
                onSelectFile(file.path);
              }
            }}
          >
            {file.type === "dir" ? (
               <div className="flex items-center gap-1 min-w-0">
                {expanded[file.path] ? (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
                <Folder className="w-4 h-4 text-blue-500/80 fill-blue-500/20 shrink-0" />
               </div>
            ) : (
                <div className="flex items-center gap-1 min-w-0 ml-[1.125rem]">
                    <FileIcon className="w-4 h-4 text-stone-400 shrink-0" />
                </div>
            )}
            <span className="truncate">{file.name}</span>
          </div>
          {file.type === "dir" && expanded[file.path] && (
            <FileTree path={file.path} onSelectFile={onSelectFile} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}
