"use client";

import PurifierCard from "@/components/PurifierCard";
import { useParams } from "next/navigation";

export default function PurifierDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Purifier: {id}</h1>
        <div className="flex flex-col gap-6">
          <PurifierCard id={id} />
        </div>
      </div>
    </main>
  );
}
