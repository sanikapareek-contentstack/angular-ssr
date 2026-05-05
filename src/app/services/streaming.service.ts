import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StreamingService {

  private sampleText = 'Welcome to the streaming test! This is a demonstration of streaming responses. The text appears progressively as if being streamed. You can test different streaming speeds: - Slow: 300ms delay between chunks (3 words) - Medium: 150ms delay between chunks (3 words) - Fast: 50ms delay between chunks (3 words) This simulates real-time streaming like ChatGPT! Thank you for testing the streaming feature.';

  constructor(private http: HttpClient) { }

  // HTTP Streaming with chunked transfer encoding (using same server)
  getHttpStreamingResponse(speed: 'slow' | 'medium' | 'fast'): Observable<string> {
    return new Observable<string>(observer => {
      // Use relative URL - same server as the Angular app
      const url = `/api/stream/${speed}`;
      
      fetch(url)
        .then(response => {
          if (!response.body) {
            throw new Error('ReadableStream not supported');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          const readChunk = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                console.log(`[${speed}] Streaming completed on client`);
                observer.complete();
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              accumulated += chunk;
              console.log(`[${speed}] Received chunk: "${chunk}" (total length: ${accumulated.length})`);
              observer.next(accumulated);
              readChunk();
            }).catch(error => {
              console.error(`[${speed}] Streaming error:`, error);
              observer.error(error);
            });
          };

          readChunk();
        })
        .catch(error => {
          observer.error(error);
        });

      // Cleanup function
      return () => {
        // Cleanup if needed
      };
    });
  }


  getBufferedResponse(): Observable<string> {
    // Use same server API route
    return this.http.get<{text: string}>('/api/buffered').pipe(
      map(response => response.text)
    );
  }

  // For backward compatibility - now uses HTTP streaming
  getStreamingResponse(speed: 'slow' | 'medium' | 'fast'): Observable<string> {
    return this.getHttpStreamingResponse(speed);
  }
}
