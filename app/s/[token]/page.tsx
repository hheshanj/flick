import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SharePageClient from "./SharePageClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;

  const share = await prisma.share.findUnique({
    where: { token },
  });

  if (!share || share.expiresAt < new Date()) {
    notFound();
  }

  const now = new Date();
  const timeRemaining = Math.max(0, share.expiresAt.getTime() - now.getTime());

  return (
    <SharePageClient
      fileName={share.fileName}
      fileSize={Number(share.fileSize)}
      mimeType={share.mimeType}
      token={share.token}
      initialTimeRemaining={timeRemaining}
      hasPassword={!!share.password}
      maxDownloads={share.maxDownloads}
      downloadCount={share.downloadCount}
    />
  );
}
