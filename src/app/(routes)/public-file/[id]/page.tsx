"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function PublicFilePage() {
  const params = useParams();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fileId = params.id as string;

  useEffect(() => {
    checkFileAccess();
  }, [fileId]);

  const checkFileAccess = async () => {
    try {
      const response = await fetch(`/api/files/${fileId}`);

      if (response.ok) {
        window.location.href = `/api/files/${fileId}`;
      } else if (response.status === 401) {
        setLoading(false);
      } else {
        setError("File not found or access denied");
        setLoading(false);
      }
    } catch {
      setError("An error occurred");
      setLoading(false);
    }
  };

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `/api/files/${fileId}?passkey=${encodeURIComponent(passkey)}`
      );

      if (response.ok) {
        window.location.href = `/api/files/${fileId}?passkey=${encodeURIComponent(
          passkey
        )}`;
      } else {
        setError("Invalid passkey");
      }
    } catch {
      setError("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            File Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This file is protected with a passkey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePasskeySubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="passkey"
              className="block text-sm font-medium text-gray-700"
            >
              Enter Passkey
            </label>
            <input
              id="passkey"
              name="passkey"
              type="text"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Passkey"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Access File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
