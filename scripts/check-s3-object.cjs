const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

function getEnv(name){ const v = process.env[name]; return typeof v === 'string' ? v.trim() : v }

const REGION = getEnv('AWS_REGION') || getEnv('AWS_DEFAULT_REGION');
const ACCESS_KEY = getEnv('AWS_ACCESS_KEY_ID') || getEnv('AWS_ACCESS_KEY');
const SECRET = getEnv('AWS_SECRET_ACCESS_KEY') || getEnv('AWS_SECRET');
const BUCKET = getEnv('S3_BUCKET_NAME') || getEnv('AWS_S3_BUCKET_NAME') || getEnv('S3_BUCKET');

if (!REGION || !ACCESS_KEY || !SECRET || !BUCKET) {
  console.error('Missing env vars', { REGION: !!REGION, ACCESS_KEY: !!ACCESS_KEY, SECRET: !!SECRET, BUCKET: !!BUCKET });
  process.exit(1);
}

const key = process.argv[2];
if (!key) {
  console.error('Usage: node scripts/check-s3-object.cjs <key-path-e.g. bot-avatars/user-123.png>');
  process.exit(1);
}

const s3 = new S3Client({ region: REGION, credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET } });

(async () => {
  try {
    console.log('Checking object:', { bucket: BUCKET, key });
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log('HeadObject OK:', {
      ContentType: head.ContentType,
      ContentLength: head.ContentLength,
      LastModified: head.LastModified,
      ETag: head.ETag
    });
  } catch (err) {
    console.error('HeadObject error:', err);
  }

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  console.log('Testing public URL (HEAD):', publicUrl);

  const req = https.request(publicUrl, { method: 'HEAD' }, (res) => {
    console.log('Public URL status:', res.statusCode);
    console.log('Headers:', res.headers);
    res.resume();
  });
  req.on('error', (e) => console.error('Fetch error:', e));
  req.end();
})();
