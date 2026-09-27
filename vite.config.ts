import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function vaultSyncPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'vault_data.json');

  function loadData() {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(dataFile)) {
        const initial = { vault: null, memories: [], chatMessages: [] };
        fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2), 'utf-8');
        return initial;
      }
      const raw = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { vault: null, memories: [], chatMessages: [] };
    }
  }

  function saveData(data: any) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing vault_data.json:', err);
    }
  }

  return {
    name: 'vite-plugin-vault-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              let parsedBody: any = null;
              if (body) {
                parsedBody = JSON.parse(body);
              }

              const data = loadData();

              if (req.url === '/api/vault' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ vault: data.vault }));
                return;
              }

              if (req.url === '/api/vault' && req.method === 'POST') {
                data.vault = parsedBody.vault;
                saveData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, vault: data.vault }));
                return;
              }

              if (req.url === '/api/memories' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ memories: data.memories }));
                return;
              }

              if (req.url === '/api/memories' && req.method === 'POST') {
                const mem = parsedBody.memory;
                const existingIndex = data.memories.findIndex((m: any) => m.id === mem.id);
                if (existingIndex >= 0) {
                  data.memories[existingIndex] = mem;
                } else {
                  data.memories.unshift(mem);
                }
                saveData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, memories: data.memories }));
                return;
              }

              if (req.url?.startsWith('/api/memories/') && req.method === 'DELETE') {
                const id = req.url.split('/api/memories/')[1];
                data.memories = data.memories.filter((m: any) => m.id !== id);
                saveData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
                return;
              }

              if (req.url === '/api/chat' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ messages: data.chatMessages }));
                return;
              }

              if (req.url === '/api/chat' && req.method === 'POST') {
                const msg = parsedBody.message;
                data.chatMessages.push(msg);
                saveData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, messages: data.chatMessages }));
                return;
              }

              if (req.url === '/api/reset' && req.method === 'POST') {
                const cleared = { vault: null, memories: [], chatMessages: [] };
                saveData(cleared);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
                return;
              }

              next();
            } catch (err) {
              console.error('API Error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vaultSyncPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
  },
})
