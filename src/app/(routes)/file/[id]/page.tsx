"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = ({ params: { id } }: { params: { id: string } }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const router = useRouter();

  const fetchFile = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/files/${id}`, {
        headers: { "x-api-key": "abcd" },
      });
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchFile();
  }, [id]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check");
      if (!response.ok) router.push("/not-found");
    } catch {
      router.push("/not-found");
    }
  };

  return (
    <div>
      {fileUrl ? (
        <iframe
          src={fileUrl}
          width="100%"
          height="800px"
          style={{ border: "none" }}
        />
      ) : (
        <p>Loading document...</p>
      )}
    </div>
  );
};

export default Page;
