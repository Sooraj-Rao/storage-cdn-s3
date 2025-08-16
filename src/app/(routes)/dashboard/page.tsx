/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Eye, LogOut, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";

interface FileRecord {
  _id: string;
  filename: string;
  s3Key: string;
  contentType: string;
  size: number;
  accessType: "private" | "public";
  publicId?: string;
  folderName: string;
  uploadedAt: string;
}

export default function AdminDashboard() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchFiles();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check");
      if (!response.ok) router.push("/not-found");
    } catch {
      router.push("not-found");
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const deleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setFiles(files.filter((f) => f._id !== fileId));
        alert("File deleted successfully!");
      } else {
        const data = await response.json();
        alert("Delete failed: " + data.error);
      }
    } catch (error) {
      alert("Delete failed: " + (error as Error).message);
    }
  };

  const getFileUrl = (file: FileRecord) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/files/${file.publicId}`;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const filteredFiles = files.filter((file) => {
    const query = searchQuery.toLowerCase();
    if (searchQuery && !file.filename.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">File Storage Admin</h1>
        <button className="px-3 py-2 border rounded" onClick={handleLogout}>
          <LogOut className="inline-block w-4 h-4 mr-2" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow p-4 rounded">
          <div className="text-2xl font-bold">{files.length}</div>
          <div className="text-sm text-gray-500">Total Files</div>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
          <div className="text-sm text-gray-500">Total Size</div>
        </div>
      </div>

      <div className="bg-white shadow p-4 rounded mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Search Files
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="pl-10 w-fit border rounded px-2 py-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by filename, type, or folder..."
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              className="px-3 py-2 bg-gray-100 rounded border"
              onClick={fetchFiles}
              disabled={loading}
            >
              <RefreshCw className="inline-block w-4 h-4 mr-2" /> Refresh
            </button>
          </div>

            <div className="flex items-end">
          <Link href="/upload">
              <button className="px-3 py-2 bg-gray-100 rounded border">
                <Upload className="inline-block w-4 h-4 mr-2" /> Upload
              </button>
          </Link>
            </div>
        </div>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-semibold mb-4">
          Files ({filteredFiles.length})
        </h2>
        {loading ? (
          <div className="text-center py-8">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No files found</div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div key={file._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{file.filename}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          file.accessType === "public"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {file.accessType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>
                        {formatFileSize(file.size)} • {file.contentType} •{" "}
                        {file.folderName}
                      </div>
                      <div>
                        Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                      </div>
                      <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {getFileUrl(file)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="px-2 py-1 border rounded text-sm"
                      onClick={() => copyUrl(getFileUrl(file))}
                    >
                      Copy URL
                    </button>
                    <button
                      className="p-2 border rounded"
                      onClick={() => window.open(getFileUrl(file), "_blank")}
                    >
                      {" "}
                      <Eye className="w-4 h-4" />{" "}
                    </button>

                    <button
                      className="p-2 border rounded text-red-600"
                      onClick={() => deleteFile(file._id, file.filename)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
