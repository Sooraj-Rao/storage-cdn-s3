"use client";

import { useState } from "react";
import { Upload, Copy, Trash2 } from "lucide-react";

const API_BASE_URL = "";
const API_KEY = "";

interface UploadResponse {
  success: boolean;
  fileId: string;
  fileUrl: string;
  filename: string;
  size: number;
  contentType: string;
  accessType: string;
  folder: string;
}

export default function SimpleApiDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folder, setFolder] = useState("uploads");
  const [accessType, setAccessType] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);

  const uploadFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", folder);
      formData.append("accessType", accessType);

      const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles((prev) => [result, ...prev]);
        setSelectedFile(null);
        alert("File uploaded successfully!");
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      alert("Upload failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}`, {
        method: "DELETE",
        headers: { "x-api-key": API_KEY },
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
        alert("File deleted!");
      } else {
        alert("Delete failed: " + result.error);
      }
    } catch (error) {
      alert("Delete failed: " + (error as Error).message);
    }
  };

  const updateFileAccess = async (
    fileId: string,
    newAccessType: "public" | "private"
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}`, {
        method: "PUT",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessType: newAccessType }),
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.fileId === fileId
              ? { ...f, accessType: newAccessType, fileUrl: result.fileUrl }
              : f
          )
        );
        alert("Access updated!");
      } else {
        alert("Update failed: " + result.error);
      }
    } catch (error) {
      alert("Update failed: " + (error as Error).message);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Simple File Storage API</h1>
          <p className="text-gray-600">Upload → Get URL → Use in your apps</p>
        </div>

        <div className="bg-white shadow p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload File
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select File
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Folder</label>
              <input
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Access</label>
              <select
                value={accessType}
                onChange={(e) =>
                  setAccessType(e.target.value as "public" | "private")
                }
                className="w-full border rounded px-2 py-1"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <button
            onClick={uploadFile}
            disabled={!selectedFile || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            {loading ? "Uploading..." : "Upload & Get URL"}
          </button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.fileId} className="border p-4 rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{file.filename}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {file.accessType} • {file.folder}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyUrl(file.fileUrl)}
                        className="border p-2 rounded hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteFile(file.fileId)}
                        className="border p-2 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-100 text-sm p-2 rounded font-mono break-all">
                    {file.fileUrl}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="text-sm px-3 py-1 border rounded"
                      onClick={() =>
                        updateFileAccess(
                          file.fileId,
                          file.accessType === "public" ? "private" : "public"
                        )
                      }
                    >
                      Make {file.accessType === "public" ? "Private" : "Public"}
                    </button>
                    <button
                      className="text-sm px-3 py-1 border rounded"
                      onClick={() => window.open(file.fileUrl, "_blank")}
                    >
                      View File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">API Usage</h2>

          <div>
            <h4 className="font-medium">1. Upload File</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {`curl -X POST ${API_BASE_URL}/api/v1/upload \\
  -H "x-api-key: YOUR_API_KEY" \\
  -F "file=@image.jpg" \\
  -F "folder=uploads" \\
  -F "accessType=public"`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">2. Delete File</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {`curl -X DELETE ${API_BASE_URL}/api/v1/files/FILE_ID \\
  -H "x-api-key: YOUR_API_KEY"`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">3. Update Access</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {`curl -X PUT ${API_BASE_URL}/api/v1/files/FILE_ID \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"accessType": "private"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
