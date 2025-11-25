import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));

// Initialize connection immediately
(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
})();