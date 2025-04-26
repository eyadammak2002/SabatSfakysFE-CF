import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { ChatMessage, ChatService } from '../services/chat.service';
declare var global: any;
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Messages du chat public
  public messages: ChatMessage[] = [];
  
  // Message en cours de rédaction
  public messageContent: string = '';
  
  // Informations sur l'utilisateur
  public username: string = '';
  public userId: number | null = null;
  public connected: boolean = false;
  
  // Pour les messages privés
  public selectedUser: number | null = null;
  public privateMessages: ChatMessage[] = [];
  
  // Pour rejoindre une salle de chat
  public roomId: string = '';
  public currentRoom: string | null = null;
  public roomMessages: ChatMessage[] = [];
  
  private subscription: Subscription | null = null;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    // S'abonner aux messages du chat
    this.subscription = this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
    });
  }

  // Se connecter au chat
  connect(): void {
    if (this.username && this.userId) {
      this.chatService.setCurrentUser({
        id: this.userId,
        username: this.username
      });
      this.connected = true;
    }
  }

  // Envoyer un message public
  sendMessage(): void {
    if (this.messageContent && this.connected) {
      if (this.selectedUser) {
        // Envoyer un message privé
        this.chatService.sendPrivateMessage(this.messageContent, this.selectedUser);
        this.privateMessages = this.chatService.getPrivateMessages(this.selectedUser);
      } else if (this.currentRoom) {
        // Envoyer un message dans une salle
        this.chatService.sendRoomMessage(this.messageContent, this.currentRoom);
        this.roomMessages = this.chatService.getRoomMessages(this.currentRoom);
      } else {
        // Envoyer un message public
        this.chatService.sendPublicMessage(this.messageContent);
      }
      
      this.messageContent = '';
    }
  }

  // Sélectionner un utilisateur pour chat privé
  selectUser(userId: number): void {
    this.selectedUser = userId;
    this.currentRoom = null;
    this.privateMessages = this.chatService.getPrivateMessages(userId);
    
    // Charger l'historique des messages privés
    if (this.userId) {
      this.chatService.loadPrivateMessageHistory(this.userId, userId)
        .subscribe(messages => {
          // Mettre à jour les messages privés avec l'historique
          this.privateMessages = messages;
        });
    }
  }

  // Rejoindre une salle de chat
  joinRoom(): void {
    if (this.roomId && this.connected) {
      this.chatService.joinRoom(this.roomId);
      this.currentRoom = this.roomId;
      this.selectedUser = null;
      this.roomMessages = this.chatService.getRoomMessages(this.roomId);
      
      // Charger l'historique des messages de la salle
      this.chatService.loadRoomMessageHistory(this.roomId)
        .subscribe(messages => {
          // Mettre à jour les messages de la salle avec l'historique
          this.roomMessages = messages;
        });
    }
  }

  // Revenir au chat public
  goToPublicChat(): void {
    this.selectedUser = null;
    this.currentRoom = null;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}