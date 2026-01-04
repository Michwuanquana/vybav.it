FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apt-get update && apt-get install -y libc6
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY www/package.json www/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/www
RUN npm run build

# Production image, copy all the files and run next
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure the directory is owned by www-data before switching user
RUN chown www-data:www-data /app

# Use www-data user
USER www-data

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=www-data:www-data /app/www/.next/standalone ./
COPY --from=builder --chown=www-data:www-data /app/www/.next/static ./www/.next/static
COPY --from=builder --chown=www-data:www-data /app/www/public ./www/public

# Fix missing native binaries for onnxruntime
COPY --from=builder --chown=www-data:www-data /app/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.14.0 ./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "www/server.js"]
