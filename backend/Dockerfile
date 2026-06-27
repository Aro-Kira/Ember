FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Build Youth Portal
COPY Ember-Youth-Portal/package*.json ./Ember-Youth-Portal/
WORKDIR /app/Ember-Youth-Portal
RUN npm ci
COPY Ember-Youth-Portal/ ./
RUN npm run build

# Build Leader Portal
WORKDIR /app
COPY Ember-Youth-Leader-Portal/package*.json ./Ember-Youth-Leader-Portal/
WORKDIR /app/Ember-Youth-Leader-Portal
RUN npm ci
COPY Ember-Youth-Leader-Portal/ ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY backend/uploads/ ./uploads/

COPY --from=frontend-builder /app/Ember-Youth-Portal/dist ./frontend-youth
COPY --from=frontend-builder /app/Ember-Youth-Leader-Portal/dist ./frontend-leader

EXPOSE 3001

CMD ["node", "src/index.js"]
