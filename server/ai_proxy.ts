import { spawn } from 'child_process';
import path from 'path';
import { Express } from 'express';
import axios from 'axios';

const FASTAPI_PORT = 8000;
const FASTAPI_BASE_URL = `http://localhost:${FASTAPI_PORT}`;

// Function to start the FastAPI server
export function startFastAPIServer() {
  console.log('[AI Assistant] Starting FastAPI developer assistant...');
  
  // Start the process using spawn
  const pythonProcess = spawn('python', [path.join(process.cwd(), 'dev_assistant.py')], {
    env: { ...process.env },
    stdio: 'pipe'
  });

  // Log stdout and stderr
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[AI Assistant] ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[AI Assistant Error] ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[AI Assistant] Process exited with code ${code}`);
  });

  // Return the process so it can be terminated if needed
  return pythonProcess;
}

// Function to register proxy routes
export function registerAIProxyRoutes(app: Express) {
  // Proxy for chat API
  app.post('/chat', async (req, res) => {
    try {
      const response = await axios.post(`${FASTAPI_BASE_URL}/chat`, req.body);
      res.json(response.data);
    } catch (error) {
      console.error('[AI Assistant Proxy Error]', error);
      res.status(500).json({ 
        message: 'Error communicating with AI Assistant',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Proxy for chat UI
  app.get('/chat-ui', async (req, res) => {
    try {
      const response = await axios.get(`${FASTAPI_BASE_URL}/chat-ui`);
      res.send(response.data);
    } catch (error) {
      console.error('[AI Assistant UI Proxy Error]', error);
      res.status(500).send(`
        <html>
          <body>
            <h1>Error: Developer Assistant Not Available</h1>
            <p>The AI assistant service is not running. Please check server logs.</p>
            <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
          </body>
        </html>
      `);
    }
  });
}