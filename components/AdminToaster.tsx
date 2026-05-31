"use client";

import { Toaster } from "react-hot-toast";

export default function AdminToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2600,
        style: {
          borderRadius: "10px",
          border: "1px solid #d8e0ee",
          background: "#ffffff",
          color: "#24334d",
        },
      }}
    />
  );
}
