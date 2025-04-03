import { Injectable } from '@angular/core';
import { Client, Message, StompSubscription } from '@stomp/stompjs';

import { Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
 // private stompClient:Client=new Client();
  private notificationsSubject = new Subject<string>(); // Stocke les notifications
  private subscription: StompSubscription | null = null;

  constructor() {  this.stompClient=new Client({brokerURL:'ws://localhost:8080:ws'});
  this.stompClient.onConnect=()=>{
    this.stompClient.subscribe('/topic/notifications',message=>{
      this.notification.push(message.body);
      console.log(message.body);
      alert("notification:"+message.body);
    });
  },
  this.stompClient.activate;}
   

 private stompClient:Client;
  notification:String[]=[];

   // Connexion WebSocket (uniquement pour écouter)
  /* connect(): void {
    const socket = new SockJS('http://localhost:8080/ws'); 
    this.stompClient = over(socket);

    this.stompClient.connect({}, (frame) => {
      console.log('✅ WebSocket connecté:', frame);

      // S'abonner aux notifications sans rafraîchir toute la page
      this.subscription = this.stompClient!.subscribe('/topic/notifications', (message: Message) => {
        this.notificationsSubject.next(message.body); // Ajoute la notification
      });

    }, (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
    });
  }

  // Retourne les nouvelles notifications (Observable)
  getNotifications() {
    return this.notificationsSubject.asObservable();
  }

  // Déconnexion WebSocket
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.disconnect(() => console.log('🛑 Déconnecté du WebSocket'));
    }
  }*/
}
