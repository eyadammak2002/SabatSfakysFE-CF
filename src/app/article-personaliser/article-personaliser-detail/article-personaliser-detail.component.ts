import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { ArticlePersonaliserService, ArticlePersonaliser, ChatMessage } from '../article-personaliser.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-article-personaliser-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-personaliser-detail.component.html',
  styleUrls: ['./article-personaliser-detail.component.css']
})


export class ArticlePersonaliserDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
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
  isChatAvailable: boolean = false;
  
  private routeSub: Subscription | null = null;

  
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

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
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
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
        
        // Une fois l'article chargé, vérifier si le chat est disponible
        this.checkChatAvailability();
        
        // Puis charger l'historique des messages
        this.loadChatHistory();
      },
      error: (err) => {
        console.error("Erreur lors du chargement de l'article:", err);
        this.errorMessage = "Impossible de charger les détails de l'article.";
        this.isLoading = false;
      }
    });
  }
  
  // Vérifier si le chat est disponible
  checkChatAvailability(): void {
    if (!this.article) return;
    
    // Le chat est disponible uniquement si l'article est au statut ACCEPTE ou TERMINE
    this.isChatAvailable = this.article.statut === 'ACCEPTE' || this.article.statut === 'TERMINE';
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
          
          // S'abonner aux notifications d'erreur
          this.stompClient?.subscribe(`/user/topic/errors`, (message) => {
            const errorMsg = JSON.parse(message.body);
            console.error('Error message:', errorMsg);
            alert(errorMsg.content);
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
    
    // Vérifier si le chat est disponible avant d'envoyer
    if (!this.isChatAvailable) {
      alert("Le chat n'est pas encore disponible. Il sera activé lorsque l'article sera accepté.");
      return;
    }
    
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
    } else if (this.isClientUser() && this.article?.client?.id !== this.currentUser.id) {
      // Si c'est un message du fournisseur vers le client
      message.recipientId = this.article?.client?.id;
    }
    
    if (this.stompClient) {
      this.stompClient.publish({
        destination: `/app/chat.article.${this.articleId}`,
        body: JSON.stringify(message)
      });
    }
    
    this.messageContent = '';
  }
  
  // Déterminer si l'utilisateur actuel est un client
  isClientUser(): boolean {
    return this.currentUser && this.currentUser.roles && 
           this.currentUser.roles.includes('ROLE_CLIENT');
  }
  
  // Faire défiler automatiquement vers le bas
  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = 
        this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Erreur scrollToBottom:", err);
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
  
  // Vérifier si un message est un message système d'activation du chat
  isChatActivationMessage(message: ChatMessage): boolean {
    return message.systemMessage === true && message.type === 'CHAT_ACTIVATION';
  }
  
  
  // Retourner à la liste des articles
   goBack(): void {
    // Utiliser le rôle pour déterminer où retourner
    if (this.currentUser && this.currentUser.roles) {
      if (this.currentUser.roles.includes('ROLE_FOURNISSEUR')) {
        this.router.navigate(['/fournisseur/articles-personalises']);
      } else {
        this.router.navigate(['articlePersonaliser']);
      }
    } else {
      this.router.navigate(['/']);
    }
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