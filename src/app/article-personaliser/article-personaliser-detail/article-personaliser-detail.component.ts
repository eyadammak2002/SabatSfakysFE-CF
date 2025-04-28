import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { ArticlePersonaliserService, ArticlePersonaliser } from '../article-personaliser.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { Subscription } from 'rxjs';

// Interface pour les messages chat
interface ChatMessage {
  type: string;       // Type de message ('CHAT', 'JOIN', 'LEAVE', 'STATUS_UPDATE')
  content: string;    // Contenu du message
  sender: string;     // Nom de l'expéditeur
  senderId: number;   // ID de l'expéditeur
  timestamp: string;  // Horodatage du message
  room?: string;      // Salle de chat (optionnel)
  recipientId?: number; // ID du destinataire (pour les messages privés)
  articlePersonaliserId?: number; // ID de l'article personnalisé
  systemMessage?: boolean; // Si c'est un message système
}

@Component({
  selector: 'app-article-personaliser-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-personaliser-detail.component.html',
  styleUrls: ['./article-personaliser-detail.component.css']
})
export class ArticlePersonaliserDetailComponent implements OnInit, OnDestroy {
  articleId: number = 0;
  article: ArticlePersonaliser | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Chat properties
  stompClient: Client | null = null;
  messages: ChatMessage[] = [];
  messageContent: string = '';
  currentUser: any = null;
  connected: boolean = false;
  
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticlePersonaliserService,
    private tokenStorage: TokenStorageService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.articleId = +params['id'];
      this.loadArticle();
    });
    
    // Récupérer les informations de l'utilisateur connecté
    this.currentUser = this.tokenStorage.getUser();
    if (!this.currentUser) {
      this.errorMessage = "Vous devez être connecté pour accéder à cette page.";
      return;
    }
    
    // Initialiser la connexion WebSocket pour le chat
    this.initializeWebSocketConnection();
  }
  
  loadArticle(): void {
    if (!this.articleId) {
      this.errorMessage = "ID d'article non valide.";
      this.isLoading = false;
      return;
    }
    
    this.articleService.getArticlePersonaliserById(this.articleId).subscribe({
      next: (data) => {
        this.article = data;
        this.isLoading = false;
        
        // Une fois l'article chargé, charger l'historique des messages
        this.loadChatHistory();
      },
      error: (err) => {
        console.error("Erreur lors du chargement de l'article:", err);
        this.errorMessage = "Impossible de charger les détails de l'article.";
        this.isLoading = false;
      }
    });
  }
  
  // Initialiser la connexion WebSocket
  initializeWebSocketConnection(): void {
    try {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg) => console.log('CHAT STOMP: ' + msg)
      });

      this.stompClient.onConnect = (frame) => {
        console.log('Connected to WebSocket: ' + frame);
        this.connected = true;
        
        // S'abonner au topic de l'article
        if (this.articleId) {
          this.stompClient?.subscribe(`/topic/article.${this.articleId}`, (message) => {
            const chatMessage = JSON.parse(message.body) as ChatMessage;
            console.log('Received message: ', chatMessage);
            this.messages.push(chatMessage);
            
            // Faire défiler automatiquement vers le bas
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          });
          
          // S'abonner aux notifications personnelles
          if (this.currentUser && this.currentUser.id) {
            this.stompClient?.subscribe(`/user/${this.currentUser.id}/topic/notifications`, (message) => {
              const notification = JSON.parse(message.body);
              console.log('Notification reçue:', notification);
              // Vous pourriez afficher une notification à l'utilisateur ici
            });
          }
        }
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
      };

      this.stompClient.activate();
      
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
    }
  }
  
// Dans article-personaliser-detail.component.ts
loadChatHistory(): void {
  if (!this.articleId) return;
  
  this.articleService.getChatHistoryForArticle(this.articleId).subscribe({
    next: (data) => {
      console.log("Données de chat reçues:", data);
      this.messages = data || []; // Assurez-vous que messages n'est jamais null
      // Faire défiler vers le bas après chargement
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    },
    error: (error) => {
      console.error('Erreur lors du chargement de l\'historique du chat:', error);
      // Initialiser messages comme un tableau vide en cas d'erreur
      this.messages = [];
      // Vous pourriez afficher un message d'erreur à l'utilisateur ici
    }
  });
}
  
  // Envoyer un message
  sendMessage(): void {
    if (!this.messageContent.trim() || !this.connected || !this.currentUser || !this.articleId) return;
    
    const message: ChatMessage = {
      type: 'CHAT',
      content: this.messageContent,
      sender: this.currentUser.name || this.currentUser.username || 'Utilisateur',
      senderId: this.currentUser.id,
      timestamp: new Date().toISOString(),
      articlePersonaliserId: this.articleId,
      room: `article-${this.articleId}`
    };
    
    // Si l'article a un fournisseur, ajouter le recipientId
    if (this.article && this.article.fournisseur) {
      message.recipientId = this.article.fournisseur.id;
    }
    
    if (this.stompClient) {
      this.stompClient.publish({
        destination: `/app/chat.article.${this.articleId}`,
        body: JSON.stringify(message)
      });
    }
    
    this.messageContent = '';
  }
  
  // Faire défiler automatiquement vers le bas
  scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
  
  // Formatter une date pour l'affichage
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Vérifier si un message est envoyé par l'utilisateur actuel
  isOwnMessage(message: ChatMessage): boolean {
    return this.currentUser && message.senderId === this.currentUser.id;
  }
  
  // Retourner à la liste des articles
  goBack(): void {
    this.router.navigate(['/articlePersonaliser']);
  }

  ngOnDestroy(): void {
    // Se désabonner de la route
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    
    // Fermer la connexion WebSocket
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}