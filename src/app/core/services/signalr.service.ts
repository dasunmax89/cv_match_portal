import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { CandidateMatch } from '../models/candidate.models';

export interface JobNotification {
  jobId: string;
  status: 'completed' | 'failed';
  jobType: string;
  result?: any;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private jobResults$ = new Subject<JobNotification>();
  
  // Signal for new candidate evaluation
  public candidateEvaluated = signal<CandidateMatch | null>(null);

  private get baseUrl(): string {
    if ((window as any).__API_URL__) {
      return (window as any).__API_URL__;
    }
    if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (window.location.hostname.includes('azurecontainerapps.io')) {
        const apiHost = window.location.hostname.replace(/^angular-ui[a-z0-9-]*\./, 'accepting-api.');
        return `${window.location.protocol}//${apiHost}/api/v1`;
      }
    }
    return 'http://127.0.0.1:8080/api/v1';
  }



  constructor(private http: HttpClient) {}

  async connect(userId: string = 'anonymous'): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      // 1. Negotiate with backend to acquire SignalR URL & token
      const formData = new FormData();
      formData.append('user_id', userId);

      const negotiateResp = await this.http
        .post<{ url: string; accessToken: string }>(
          `${this.baseUrl}/jobs/negotiate`,
          formData
        )
        .toPromise();

      if (!negotiateResp || !negotiateResp.url) {
        console.warn('SignalR negotiation returned empty response.');
        return;
      }

      // 2. Establish connection directly with Azure SignalR Service via WebSockets
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(negotiateResp.url, {
          accessTokenFactory: () => negotiateResp.accessToken,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // 3. Register listener for push events
      this.connection.on('jobCompleted', (notification: JobNotification) => {
        console.log('Received job notification via SignalR:', notification);
        this.jobResults$.next(notification);
      });

      this.connection.on('NewCandidateEvaluated', (candidate: CandidateMatch) => {
        console.log('New candidate evaluated:', candidate);
        this.candidateEvaluated.set(candidate);
      });

      await this.connection.start();
      console.log('SignalR connection established successfully.');
    } catch (err) {
      console.warn('SignalR connection warning (polling fallback active):', err);
    }
  }

  onJobResult(): Observable<JobNotification> {
    return this.jobResults$.asObservable();
  }

  async joinJobGroup(jobId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinJobGroup', jobId);
        console.log(`Joined job group: ${jobId}`);
      } catch (err) {
        console.error('Error joining job group', err);
      }
    }
  }

  async leaveJobGroup(jobId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveJobGroup', jobId);
        console.log(`Left job group: ${jobId}`);
      } catch (err) {
        console.error('Error leaving job group', err);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}
