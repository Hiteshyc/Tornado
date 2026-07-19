"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLoginSuccess = () => {
    setIsModalOpen(false);
    router.push("/dashboard"); // redirect target
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-md bg-black px-4 py-2 text-sm text-white"
      >
        Log in
      </button>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
