import type { Metadata } from "next";

export const metadata: Metadata = {
title: "Mahdi E-Portfolio Studio 2026",
description: "2026 Edition built with Next 16",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default Layout;
