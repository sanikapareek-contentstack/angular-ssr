import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Streaming API endpoints with chunked transfer encoding
  server.get('/api/stream/:speed', (req, res) => {
    const speed = req.params.speed;
    const sampleText = 'Welcome to the HTTP streaming test! This is a real demonstration of server-side streaming responses with chunked transfer encoding. The text appears progressively as chunks are sent from the server. You can test different streaming speeds: - Slow: 300ms delay between chunks (3 words) - Medium: 150ms delay between chunks (3 words) - Fast: 50ms delay between chunks (3 words) This simulates real-time HTTP streaming like ChatGPT uses! Thank you for testing the HTTP streaming feature.';
    
    // Set headers for chunked transfer encoding
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const words = sampleText.split(' ');
    let currentIndex = 0;

    // Determine delay based on speed
    let delay = 150; // default medium
    switch (speed) {
      case 'slow': delay = 300; break;
      case 'medium': delay = 150; break;
      case 'fast': delay = 50; break;
    }

    const sendNextChunk = () => {
      if (currentIndex < words.length) {
        let chunk = '';
        // Send up to 3 words per chunk
        for (let i = 0; i < 3 && currentIndex < words.length; i++) {
          if (currentIndex === 0) {
            chunk += words[currentIndex];
          } else {
            chunk += ' ' + words[currentIndex];
          }
          currentIndex++;
        }
        res.write(chunk);
        setTimeout(sendNextChunk, delay);
      } else {
        res.end();
      }
    };

    sendNextChunk();
  });

  // Buffered response endpoint
  server.get('/api/buffered', (req, res) => {
    const sampleText = 'Welcome to the HTTP streaming test! This is a real demonstration of server-side streaming responses with chunked transfer encoding. The text appears progressively as chunks are sent from the server. You can test different streaming speeds: - Slow: 300ms delay between words - Medium: 150ms delay between words - Fast: 50ms delay between words This simulates real-time HTTP streaming like ChatGPT uses! Thank you for testing the HTTP streaming feature.';
    
    // Simulate processing time
    setTimeout(() => {
      res.json({ text: sampleText });
    }, 1000);
  });

  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // Helper function to split HTML into chunks
  function splitHtmlIntoChunks(html: string, chunkSize = 200): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < html.length; i += chunkSize) {
      chunks.push(html.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Helper function to get delay based on speed
  function getStreamingDelay(speed?: string): number {
    switch (speed) {
      case 'slow': return 300;
      case 'medium': return 150; 
      case 'fast': return 50;
      default: return 150;
    }
  }

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers, query } = req;
    
    // Check if streaming is requested
    const isStreaming = query['stream'] === 'true';
    const speed = query['speed'] as string;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        if (isStreaming) {
          // HTML Streaming with chunked transfer encoding
          console.log(`Starting HTML streaming with speed: ${speed || 'medium'}`);
          
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });

          const chunks = splitHtmlIntoChunks(html, 300);
          const delay = getStreamingDelay(speed);
          let chunkIndex = 0;

          const sendNextChunk = () => {
            if (chunkIndex < chunks.length) {
              console.log(`Sending HTML chunk ${chunkIndex + 1}/${chunks.length}`);
              res.write(chunks[chunkIndex]);
              chunkIndex++;
              setTimeout(sendNextChunk, delay);
            } else {
              console.log('HTML streaming completed');
              res.end();
            }
          };

          sendNextChunk();
        } else {
          // Standard buffered response
          res.header('cache-control', 'private, max-age=10').send(html);
        }
      })
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
