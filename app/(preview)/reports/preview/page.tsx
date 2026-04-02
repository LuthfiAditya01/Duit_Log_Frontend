import { PdfPreviewClient } from "@/components/reports/PdfPreviewClient";

export default async function PdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <PdfPreviewClient id={id ?? ""} />;
}
