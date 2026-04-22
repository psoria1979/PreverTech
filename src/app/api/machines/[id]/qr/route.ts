import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;
  const machine = await prisma.machine.findUnique({
    where: { id },
    select: { id: true, code: true },
  });
  if (!machine) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const target = `${origin}/machines/${machine.id}`;

  const buffer = await QRCode.toBuffer(target, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${machine.code}.png"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
