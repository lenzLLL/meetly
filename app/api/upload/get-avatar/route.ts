import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma as db} from "@/lib/db";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 1️⃣ récupérer la clé S3 en DB
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user?.botImageUrl) return NextResponse.json({ url: null })

  // 2️⃣ générer URL temporaire
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: user.botImageUrl
  })

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60 * 5 // 5h
  })

  return NextResponse.json({ url })
}
