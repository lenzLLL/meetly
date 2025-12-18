/**
 * Minimal `prisma.config.ts` to provide the database connection URL for Prisma tools
 * Prisma v7 moved connection URLs out of `schema.prisma` and into this config file.
 *
 * If your Prisma CLI or migrate commands still complain, adapt this file to match
 * your deployment / adapter (for example if you use Prisma Accelerate).
 *
 * Note: keep secrets (DATABASE_URL) in environment variables.
 */

const config = {
   schema: "prisma/schema.prisma",
  datasources: {
    db: {
      provider: 'postgresql',
      url:process.env.DATABASE_URL
    },
  },
};

export default config;
