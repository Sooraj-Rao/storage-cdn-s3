"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/app/components/logout-button";
import FileActionsMenu from "@/app/components/file-actions-menu";
import FileAccessModal from "@/app/components/file-access-modal";
import DeleteConfirmationModal from "@/app/components/delete-confirmation-modal";
import Toast from "@/app/components/toast";

interface FileRecord {
  _id: string;
  filename: string;
  s3Key: string;
  contentType: string;
  size: number;
  userId: string;
  accessType: "private" | "public" | "passkey";
  passkey?: string;
  publicId?: string;
  uploadedAt: string;
}

interface User {
  _id: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchUserAndFiles();
  }, []);

  const fetchUserAndFiles = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessSettings = (file: FileRecord) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
  };

  const handleAccessUpdate = () => {
    fetchUserAndFiles();
  };

  const handleDeleteClick = (file: FileRecord) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileToDelete._id}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        setToast({
          message: `${fileToDelete.filename} deleted successfully!`,
          type: "success",
        });
        fetchUserAndFiles(); 
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Failed to delete file",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "An error occurred while deleting the file",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch("/api/files/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) }),
      });

      if (response.ok) {
        const data = await response.json();
        setToast({ message: data.message, type: "success" });
        setSelectedFiles(new Set());
        setIsMultiSelectMode(false);
        fetchUserAndFiles();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Failed to delete files",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "An error occurred while deleting files",
        type: "error",
      });
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f._id)));
    }
  };

  const getAccessBadge = (file: FileRecord) => {
    switch (file.accessType) {
      case "private":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Private
          </span>
        );
      case "public":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Public
          </span>
        );
      case "passkey":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Passkey
          </span>
        );
      default:
        return null;
    }
  };

  const getFileUrl = (file: FileRecord) => {
    if (file.accessType === "private") {
      return `/api/files/${file._id}`;
    } else if (file.accessType === "passkey") {
      return `/api/files/${file.publicId}?passkey=${file.passkey}`;
    } else {
      return `/api/files/${file.publicId}`;
    }
  };

  const copyToClipboard = async (text: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `Link copied for ${filename}!`, type: "success" });
    } catch (err) {
      console.error("Failed to copy: ", err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setToast({ message: `Link copied for ${filename}!`, type: "success" });
    }
  };

  const copyWithPasskey = async (file: FileRecord) => {
    const baseUrl = `${window.location.origin}${getFileUrl(file)}`;
    const urlWithPasskey = `${baseUrl}?passkey=${encodeURIComponent(
      file.passkey || ""
    )}`;

    try {
      await navigator.clipboard.writeText(urlWithPasskey);
      setToast({
        message: `Complete link with passkey copied for ${file.filename}!`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
      const textArea = document.createElement("textarea");
      textArea.value = urlWithPasskey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setToast({
        message: `Complete link with passkey copied for ${file.filename}!`,
        type: "success",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">File Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isMultiSelectMode && (
                <>
                  <button
                    onClick={() => setIsMultiSelectMode(true)}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Select
                  </button>
                  <Link
                    href="/upload"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Upload File
                  </Link>
                </>
              )}
              {isMultiSelectMode && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedFiles.size} selected
                  </span>
                  <button
                    onClick={selectAllFiles}
                    className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {selectedFiles.size === files.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {selectedFiles.size > 0 && (
                    <button
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Delete Selected
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(false);
                      setSelectedFiles(new Set());
                    }}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {user.email}
            </h2>
            <p className="text-gray-600">
              Manage your uploaded files and access settings
            </p>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                No files uploaded yet
              </div>
              <Link
                href="/upload"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium"
              >
                Upload Your First File
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li
                    key={file._id}
                    className={selectedFiles.has(file._id) ? "bg-blue-50" : ""}
                  >
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isMultiSelectMode && (
                            <input
                              type="checkbox"
                              checked={selectedFiles.has(file._id)}
                              onChange={() => toggleFileSelection(file._id)}
                              className="mr-4 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gray-300 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 text-xs font-medium">
                                {file.filename.split(".").pop()?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">
                                {file.filename}
                              </div>
                              {getAccessBadge(file)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {!isMultiSelectMode && (
                          <div className="flex items-center">
                            <FileActionsMenu
                              onDelete={() => handleDeleteClick(file)}
                              onSettings={() => handleAccessSettings(file)}
                              onView={() =>
                                window.open(getFileUrl(file), "_blank")
                              }
                              onDownload={() => {
                                if (file.accessType === "passkey") {
                                  window.open(
                                    `${getFileUrl(file)}&download=true`,
                                    "_blank"
                                  );
                                } else {
                                  window.open(
                                    `${getFileUrl(file)}?download=true`,
                                    "_blank"
                                  );
                                }
                              }}
                              onCopyLink={() =>
                                copyToClipboard(
                                  `${window.location.origin}${getFileUrl(
                                    file
                                  )}`,
                                  file.filename
                                )
                              }
                              onCopyWithPasskey={() => copyWithPasskey(file)}
                              showCopyLink={
                                (file.accessType === "public" ||
                                  file.accessType === "passkey") &&
                                !!file.publicId
                              }
                              showCopyWithPasskey={
                                file.accessType === "passkey" &&
                                !!file.publicId &&
                                !!file.passkey
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {selectedFile && (
        <FileAccessModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          file={selectedFile}
          onUpdate={handleAccessUpdate}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.filename}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Files"
        message={`Are you sure you want to delete ${selectedFiles.size} selected file(s)? This action cannot be undone.`}
        isDeleting={isBulkDeleting}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
