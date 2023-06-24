import redis from "ioredis";
const redis_client = redis.createClient({
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS
});
export const redis_set = async (key,id,data) => {
   return  await redis_client.hset(key, id, JSON.stringify(data));
};

export const redis_get = async (key,id) => {
  return await redis_client.hget(key,id);
};
