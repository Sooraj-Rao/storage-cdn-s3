"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accessType, setAccessType] = useState<
    "private" | "public" | "passkey"
  >("private");
  const [passkey, setPasskey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (accessType === "passkey" && passkey.length < 4) {
      setError("Passkey must be at least 4 characters long");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accessType", accessType);
      if (accessType === "passkey") {
        formData.append("passkey", passkey);
      }

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("File uploaded successfully!");
        setFile(null);
        setPasskey("");
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-xl font-semibold text-indigo-600 hover:text-indigo-500"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload File</h2>
            <p className="text-gray-600">
              Select a file and choose access permissions
            </p>
          </div>

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="file"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Choose file
                  </label>
                  <div className="mt-1">
                    <input
                      id="file"
                      name="file"
                      type="file"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Supported formats: Images, PDF, DOC, DOCX, TXT (Max 10MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Access Control
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        id="private"
                        name="accessType"
                        type="radio"
                        value="private"
                        checked={accessType === "private"}
                        onChange={(e) =>
                          setAccessType(e.target.value as "private")
                        }
                        className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <label
                          htmlFor="private"
                          className="text-sm font-medium text-gray-700"
                        >
                          Private (Owner Only)
                        </label>
                        <p className="text-sm text-gray-500">
                          Only you can access this file
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <input
                        id="public"
                        name="accessType"
                        type="radio"
                        value="public"
                        checked={accessType === "public"}
                        onChange={(e) =>
                          setAccessType(e.target.value as "public")
                        }
                        className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <label
                          htmlFor="public"
                          className="text-sm font-medium text-gray-700"
                        >
                          Public (Anyone with Link)
                        </label>
                        <p className="text-sm text-gray-500">
                          Anyone with the link can access this file
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <input
                        id="passkey"
                        name="accessType"
                        type="radio"
                        value="passkey"
                        checked={accessType === "passkey"}
                        onChange={(e) =>
                          setAccessType(e.target.value as "passkey")
                        }
                        className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <label
                          htmlFor="passkey"
                          className="text-sm font-medium text-gray-700"
                        >
                          Passkey Protected
                        </label>
                        <p className="text-sm text-gray-500">
                          Requires a passkey to access the file
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {accessType === "passkey" && (
                  <div>
                    <label
                      htmlFor="passkey-input"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Passkey
                    </label>
                    <input
                      id="passkey-input"
                      type="text"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      placeholder="Enter passkey (min 4 characters)"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      minLength={4}
                      required
                    />
                  </div>
                )}

                {file && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">
                      Selected file:
                    </h4>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        <strong>Name:</strong> {file.name}
                      </p>
                      <p>
                        <strong>Size:</strong>{" "}
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p>
                        <strong>Type:</strong> {file.type}
                      </p>
                      <p>
                        <strong>Access:</strong>{" "}
                        {accessType === "private"
                          ? "Private (Owner Only)"
                          : accessType === "public"
                          ? "Public (Anyone with Link)"
                          : "Passkey Protected"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Link
                    href="/dashboard"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
