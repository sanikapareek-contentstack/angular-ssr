import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamingService } from '../services/streaming.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-streaming-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './streaming-test.component.html',
  styleUrl: './streaming-test.component.css'
})
export class StreamingTestComponent implements OnDestroy {
  currentOutput = '';
  isStreaming = false;
  private subscription?: Subscription;

  constructor(private streamingService: StreamingService) {}

  startHttpStreaming(speed: 'slow' | 'medium' | 'fast'): void {
    this.resetOutput();
    this.isStreaming = true;

    this.subscription = this.streamingService.getHttpStreamingResponse(speed).subscribe({
      next: (text) => {
        this.currentOutput = text;
      },
      complete: () => {
        this.isStreaming = false;
      },
      error: (error) => {
        console.error('HTTP Streaming error:', error);
        this.isStreaming = false;
      }
    });
  }


  getBufferedResponse(): void {
    this.resetOutput();
    this.isStreaming = true;

    this.subscription = this.streamingService.getBufferedResponse().subscribe({
      next: (text) => {
        this.currentOutput = text;
        this.isStreaming = false;
      },
      error: (error) => {
        console.error('Buffered response error:', error);
        this.isStreaming = false;
      }
    });
  }


  public clearOutput(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.currentOutput = '';
    this.isStreaming = false;
  }

  private resetOutput(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.currentOutput = '';
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
