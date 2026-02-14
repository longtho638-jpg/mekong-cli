"use client";

import { useState, useEffect } from "react";
import { FileTree } from "./FileTree";
import { CodeViewer } from "./CodeViewer";
import { Lock, Terminal, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function CodePageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (password === "admin123") {
      localStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Sai mật khẩu!");
    }
  };

  const handleFileSelect = async (path: string) => {
    setSelectedFile(path);
    setLoadingContent(true);
    setFileContent(null);
    try {
      const res = await fetch(`/api/code/content?file=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      } else {
        setFileContent("Error loading file.");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      setFileContent("Error loading file.");
    } finally {
      setLoadingContent(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="bg-stone-900 p-8 rounded-2xl border border-stone-800 text-center max-w-md w-full">
          <div className="bg-stone-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-stone-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Developer Access</h1>
          <p className="text-stone-400 mb-6 text-sm">Restricted area for system administrators.</p>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Access Key"
              className="bg-stone-950 border-stone-800 text-white"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full bg-stone-100 text-stone-900 hover:bg-stone-200">
              Unlock Console
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-950 text-stone-200 overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-stone-900 border-r border-stone-800 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-80" : "w-0 border-r-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-stone-100">
            <Terminal className="w-5 h-5 text-green-400" />
            <span>Project Files</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-6 w-6">
             <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <FileTree onSelectFile={handleFileSelect} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-stone-800 flex items-center px-4 justify-between bg-stone-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
            )}
            <div className="text-sm font-medium text-stone-400">
              {selectedFile ? selectedFile : "Select a file to view"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
                <Button variant="outline" size="sm" className="bg-stone-900 border-stone-700 hover:bg-stone-800 text-stone-300">
                    Exit to Admin
                </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-hidden p-4 bg-stone-950">
          <CodeViewer content={fileContent} fileName={selectedFile} loading={loadingContent} />
        </main>
      </div>
    </div>
  );
}
