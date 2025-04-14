import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { HttpClient } from '@angular/common/http';

declare var global: any;

export interface NotificationEntity {
  idNotification: number | null;
  createdAt: string | null; // Peut être null pour les invités
  message: string;
  readable: number;
  userId: number;
}


@Injectable({
  providedIn: 'root'
})


export class NotificationService implements OnDestroy {

  private apiUrl = 'http://localhost:8080/api/notification/notification';

  private stompClient: Client | null = null;
  private notificationsSubject = new BehaviorSubject<string[]>([]);
  notifications$: Observable<string[]> = this.notificationsSubject.asObservable();
  private notifications: string[] = [];
  private connected = false;

  constructor(private http:HttpClient) {
    if (typeof global === 'undefined') {
      (window as any).global = window;
    }
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection(): void {
    try {
      // Création du client STOMP avec la nouvelle API
      this.stompClient = new Client({
        // Fonction pour créer la connexion WebSocket
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        
        // Configuration de la reconnexion automatique
        reconnectDelay: 5000,
        
        // Configuration des heartbeats
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        // Activer le debug
        debug: (msg) => console.log('STOMP: ' + msg)
      });

      // Gestionnaire de connexion
      this.stompClient.onConnect = (frame) => {
        console.log('Connected to WebSocket: ' + frame);
        this.connected = true;
        
        // S'abonner au topic des notifications
        this.stompClient?.subscribe('/topic/notifications', (message) => {
          console.log('Received notification: ', message.body);
          this.notifications.push(message.body);
          // Mettre à jour le subject avec un nouveau tableau pour déclencher la détection de changement
          this.notificationsSubject.next([...this.notifications]);
        });
      };

      // Gestionnaire d'erreur
      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
      };

      // Activer la connexion
      this.stompClient.activate();
      
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
    }
  }

  // Méthode pour envoyer un message
  sendMessage(message: string): void {
    if (this.connected && this.stompClient) {
      this.stompClient.publish({
        destination: '/app/sendMessage',
        body: message
      });
    } else {
      console.error('Cannot send message, not connected to WebSocket');
    }
  }

  // Méthode pour récupérer toutes les notifications
  getNotifications(): string[] {
    return this.notifications;
  }

  // Méthode pour effacer toutes les notifications
  clearNotifications(): void {
    this.notifications = [];
    this.notificationsSubject.next([]);
  }
  
  // Méthode pour vérifier l'état de la connexion
  isConnected(): boolean {
    return this.connected;
  }

  // Nettoyer lors de la destruction
  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('WebSocket disconnected');
    }
  }


  getAllNotifications(id:any): Observable<Notification[]> {
      return this.http.get<Notification[]>(`${this.apiUrl}/${id}`);
    }
  
}