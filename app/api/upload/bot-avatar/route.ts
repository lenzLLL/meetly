import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

function getEnv(name: string) {
    const raw = (process.env as any)[name]
    return typeof raw === 'string' ? raw.trim() : raw
}

const REGION = getEnv('AWS_REGION') || getEnv('AWS_DEFAULT_REGION')
const ACCESS_KEY = getEnv('AWS_ACCESS_KEY_ID') || getEnv('AWS_ACCESS_KEY')
const SECRET = getEnv('AWS_SECRET_ACCESS_KEY') || getEnv('AWS_SECRET')
const BUCKET = getEnv('S3_BUCKET_NAME') || getEnv('AWS_S3_BUCKET_NAME') || getEnv('S3_BUCKET')

function createS3Client() {
    if (!REGION || !ACCESS_KEY || !SECRET) return null
    return new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: ACCESS_KEY,
            secretAccessKey: SECRET
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        if (!BUCKET || !REGION || !ACCESS_KEY || !SECRET) {
            console.error('S3 config missing', { BUCKET: !!BUCKET, REGION: !!REGION, ACCESS_KEY: !!ACCESS_KEY, SECRET: !!SECRET })
            return NextResponse.json({ error: 'S3 not configured. Check S3_BUCKET_NAME (or AWS_S3_BUCKET_NAME), AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.' }, { status: 500 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'no file provided' }, { status: 400 })
        }

        const MAX_BYTES = 5 * 1024 * 1024 // 5MB
        if (file.size && file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'file too large (max 5MB)' }, { status: 400 })
        }

        const rawName = String(file.name || '')
        const fileExtension = rawName.includes('.') ? rawName.split('.').pop() : 'bin'
        const fileName = `bot-avatars/${userId}-${Date.now()}.${fileExtension}`

        const buffer = Buffer.from(await file.arrayBuffer())

        const s3 = createS3Client()
        if (!s3) {
            return NextResponse.json({ error: 'S3 client configuration error' }, { status: 500 })
        }

        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
            CacheControl: 'public, max-age=31536000',
        })

        await s3.send(uploadCommand)

        const publicUrl = fileName

        // Génère une URL présignée (GET) valable 1 heure pour garantir l'accès
        let presignedUrl: string | null = null
        try {
            const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: fileName })
            presignedUrl = await getSignedUrl(s3, getCmd, { expiresIn: 3600*5 })
        } catch (err) {
            console.warn('failed to generate presigned url', err)
        }
        // Sauvegarde la clé dans la DB pour que `get-avatar` puisse générer
        // des URLs présignées plus tard.
        try {
            await db.user.update({ where: { id: userId }, data: { botImageUrl: fileName } })
        } catch (dbErr) {
            console.warn('failed to persist botImageUrl to DB', dbErr)
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            presignedUrl
        })

    } catch (error) {
        console.error('s3 upload error:', error)
        return NextResponse.json({ error: 'failed to upload image' }, { status: 500 })
    }
}