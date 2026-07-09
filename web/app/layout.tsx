import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supervised Learning Playground",
  description:
    "Classic supervised-ML models — decision trees, boosting, ensembles, k-NN/SVM — running live in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
