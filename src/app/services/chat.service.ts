import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { HttpClient } from '@angular/common/http';

// Interface pour les messages chat
export interface ChatMessage {
  type: string;       // Type de message ('CHAT', 'JOIN', 'LEAVE')
  content: string;    // Contenu du message
  sender: string;     // Nom de l'expéditeur
  senderId: number;   // ID de l'expéditeur
  timestamp: string;  // Horodatage du message
  room?: string;      // Salle de chat (optionnel)
  recipientId?: number; // ID du destinataire (pour les messages privés)
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private apiUrl = 'http://localhost:8080/api/chat';
  
  private stompClient: Client | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  
  private publicMessages: ChatMessage[] = [];
  private privateMessages = new Map<number, ChatMessage[]>(); // Map pour stocker les messages privés par utilisateur
  private roomMessages = new Map<string, ChatMessage[]>(); // Map pour stocker les messages par salle
  
  private connected = false;
  private currentUser: { id: number, username: string } | null = null;

  constructor(private http: HttpClient) {
    if (typeof (window as any).global === 'undefined') {
      (window as any).global = window;
    }
    this.initializeWebSocketConnection();
  }

  // Initialiser la connexion WebSocket spécifique au chat
  private initializeWebSocketConnection(): void {
    try {
      // Création du client STOMP avec l'endpoint spécifique au chat
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg) => console.log('CHAT STOMP: ' + msg)
      });

      this.stompClient.onConnect = (frame) => {
        console.log('Connected to Chat WebSocket: ' + frame);
        this.connected = true;
        
        // S'abonner au chat public
        this.stompClient?.subscribe('/topic/public', (message) => {
          const chatMessage = JSON.parse(message.body) as ChatMessage;
          console.log('Received public message: ', chatMessage);
          this.publicMessages.push(chatMessage);
          this.messagesSubject.next([...this.publicMessages]);
        });

        // Si un utilisateur est connecté, s'abonner à ses messages privés
        if (this.currentUser) {
          this.subscribeToPrivateMessages(this.currentUser.id);
        }
      };

      this.stompClient.onStompError = (frame) => {
        console.error('CHAT STOMP error:', frame);
      };

      this.stompClient.activate();
      
    } catch (error) {
      console.error('Error initializing Chat WebSocket connection:', error);
    }
  }

  // Définir l'utilisateur courant et s'abonner à ses messages privés
  setCurrentUser(user: { id: number, username: string }): void {
    this.currentUser = user;
    
    // Annoncer que l'utilisateur a rejoint le chat
    if (this.connected && this.stompClient) {
      const joinMessage: ChatMessage = {
        type: 'JOIN',
        content: `${user.username} a rejoint le chat!`,
        sender: user.username,
        senderId: user.id,
        timestamp: new Date().toISOString()
      };
      
      this.stompClient.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify(joinMessage)
      });
      
      // S'abonner aux messages privés
      this.subscribeToPrivateMessages(user.id);
    }
  }

  // S'abonner aux messages privés
  private subscribeToPrivateMessages(userId: number): void {
    if (this.connected && this.stompClient) {
      this.stompClient.subscribe(`/user/${userId}/topic/private`, (message) => {
        const chatMessage = JSON.parse(message.body) as ChatMessage;
        console.log('Received private message: ', chatMessage);
        
        // Stocker le message avec l'ID de l'autre utilisateur
        const otherUserId = chatMessage.senderId === this.currentUser?.id 
          ? chatMessage.recipientId! 
          : chatMessage.senderId;
          
        if (!this.privateMessages.has(otherUserId)) {
          this.privateMessages.set(otherUserId, []);
        }
        
        const messages = this.privateMessages.get(otherUserId)!;
        messages.push(chatMessage);
        this.privateMessages.set(otherUserId, [...messages]);
      });
    }
  }

  // S'abonner à une salle de chat spécifique
  joinRoom(roomId: string): void {
    if (this.connected && this.stompClient && this.currentUser) {
      // S'abonner au topic de la salle
      this.stompClient.subscribe(`/topic/room.${roomId}`, (message) => {
        const chatMessage = JSON.parse(message.body) as ChatMessage;
        console.log(`Received message from room ${roomId}: `, chatMessage);
        
        if (!this.roomMessages.has(roomId)) {
          this.roomMessages.set(roomId, []);
        }
        
        const messages = this.roomMessages.get(roomId)!;
        messages.push(chatMessage);
        this.roomMessages.set(roomId, [...messages]);
      });
      
      // Annoncer que l'utilisateur rejoint la salle
      const joinMessage: ChatMessage = {
        type: 'JOIN',
        content: `${this.currentUser.username} a rejoint la salle ${roomId}!`,
        sender: this.currentUser.username,
        senderId: this.currentUser.id,
        timestamp: new Date().toISOString(),
        room: roomId
      };
      
      this.stompClient.publish({
        destination: `/app/chat.room.${roomId}`,
        body: JSON.stringify(joinMessage)
      });
    }
  }

  // Envoyer un message public
  sendPublicMessage(content: string): void {
    if (this.connected && this.stompClient && this.currentUser) {
      const chatMessage: ChatMessage = {
        type: 'CHAT',
        content: content,
        sender: this.currentUser.username,
        senderId: this.currentUser.id,
        timestamp: new Date().toISOString()
      };
      
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage)
      });
    } else {
      console.error('Cannot send message, not connected to WebSocket or user not set');
    }
  }

  // Envoyer un message privé
  sendPrivateMessage(content: string, recipientId: number): void {
    if (this.connected && this.stompClient && this.currentUser) {
      const chatMessage: ChatMessage = {
        type: 'CHAT',
        content: content,
        sender: this.currentUser.username,
        senderId: this.currentUser.id,
        recipientId: recipientId,
        timestamp: new Date().toISOString()
      };
      
      this.stompClient.publish({
        destination: `/app/chat.private.${recipientId}`,
        body: JSON.stringify(chatMessage)
      });
      
      // Stocker aussi le message dans notre liste locale
      if (!this.privateMessages.has(recipientId)) {
        this.privateMessages.set(recipientId, []);
      }
      
      const messages = this.privateMessages.get(recipientId)!;
      messages.push(chatMessage);
      this.privateMessages.set(recipientId, [...messages]);
    }
  }

  // Envoyer un message dans une salle
  sendRoomMessage(content: string, roomId: string): void {
    if (this.connected && this.stompClient && this.currentUser) {
      const chatMessage: ChatMessage = {
        type: 'CHAT',
        content: content,
        sender: this.currentUser.username,
        senderId: this.currentUser.id,
        timestamp: new Date().toISOString(),
        room: roomId
      };
      
      this.stompClient.publish({
        destination: `/app/chat.room.${roomId}`,
        body: JSON.stringify(chatMessage)
      });
    }
  }

  // Obtenir les messages publics
  getPublicMessages(): ChatMessage[] {
    return this.publicMessages;
  }

  // Obtenir les messages privés avec un utilisateur
  getPrivateMessages(userId: number): ChatMessage[] {
    return this.privateMessages.get(userId) || [];
  }

  // Obtenir les messages d'une salle
  getRoomMessages(roomId: string): ChatMessage[] {
    return this.roomMessages.get(roomId) || [];
  }

  // Récupérer l'historique des messages privés depuis le serveur
  loadPrivateMessageHistory(userId1: number, userId2: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history/private/${userId1}/${userId2}`);
  }

  // Récupérer l'historique des messages d'une salle depuis le serveur
  loadRoomMessageHistory(roomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history/room/${roomId}`);
  }

  // Vérifier l'état de la connexion
  isConnected(): boolean {
    return this.connected;
  }

  // Nettoyer lors de la destruction
  ngOnDestroy(): void {
    if (this.stompClient) {
      // Envoyer un message de départ si un utilisateur est connecté
      if (this.connected && this.currentUser) {
        const leaveMessage: ChatMessage = {
          type: 'LEAVE',
          content: `${this.currentUser.username} a quitté le chat.`,
          sender: this.currentUser.username,
          senderId: this.currentUser.id,
          timestamp: new Date().toISOString()
        };
        
        this.stompClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(leaveMessage)
        });
      }
      
      this.stompClient.deactivate();
      console.log('Chat WebSocket disconnected');
    }
  }
}