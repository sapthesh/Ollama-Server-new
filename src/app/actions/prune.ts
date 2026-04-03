'use server';

import fs from 'fs';
import path from 'path';
import { checkService, measureTPS } from '@/lib/detect';
import { Redis } from '@upstash/redis';

const DATA_PATH = path.join(process.cwd(), 'public', 'data.json');

// Initialize Redis if config exists
const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function pruneServersAction() {
  console.log('Starting daily pruning service...');
  
  try {
    if (!fs.existsSync(DATA_PATH)) {
      throw new Error('Master list (data.json) not found');
    }

    const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
    const servers = JSON.parse(fileContent);
    const updatedServers = [];

    console.log(`Processing ${servers.length} servers...`);

    for (const serverItem of servers) {
      const { server } = serverItem;
      console.log(`Pinging ${server}...`);

      try {
        // Ping and get models
        const models = await checkService(server);

        if (models && models.length > 0) {
          console.log(`Server ${server} is alive. Updating metadata...`);
          
          // Measure TPS for the first model
          let tps = 0;
          let isFake = false;
          try {
            const tpsResult = await measureTPS(server, models[0]);
            if (typeof tpsResult === 'object' && 'isFake' in tpsResult) {
              isFake = true;
            } else {
              tps = Number(tpsResult);
            }
          } catch (e) {
            console.error(`TPS measurement failed for ${server}`, e);
          }

          updatedServers.push({
            server,
            models: models.map(m => m.name),
            tps,
            lastUpdate: new Date().toISOString(),
            status: isFake ? 'fake' : 'success'
          });
        } else {
          console.log(`Server ${server} unreachable or no models. Pruning...`);
        }
      } catch (error) {
        console.error(`Error health-checking ${server}:`, error);
        // If error, we prune (don't add to updatedServers)
      }
    }

    // Save back to data.json
    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedServers, null, 2));
    console.log(`Pruning complete. ${updatedServers.length}/${servers.length} servers remain.`);

    // Sync to Redis if available
    if (redis) {
      console.log('Syncing updated list to Redis...');
      const pipeline = redis.pipeline();
      pipeline.del('ollama:servers');
      for (const s of updatedServers) {
        pipeline.sadd('ollama:servers', encodeURIComponent(s.server));
      }
      await pipeline.exec();
    }

    return { 
      success: true, 
      count: updatedServers.length, 
      originalCount: servers.length 
    };

  } catch (error) {
    console.error('Pruning action failed:', error);
    return { success: false, error: String(error) };
  }
}
