import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationEntity, NotificationService } from 'src/app/services/notification.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
declare var global: any;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})

export class HeaderComponent implements OnInit {
  showFournisseurDashboard = false;
  showClientDashboard = false;
  isLoggedIn: boolean = false;
  notifications: string[] = [];
  private notificationSubscription: Subscription = new Subscription();
  private checkConnectionInterval: any;
  role: string = '';
  username?: string;
  email?: string; 
  fournisseurLogo: string = '';
  numeroIdentificationEntreprise?: string; 
  isNotificationDropdownOpen = false;
  allNotifications: NotificationEntity[] = [];
  unreadNotifications: NotificationEntity[] = [];
  readNotifications: NotificationEntity[] = [];

  constructor(
    private tokenStorageService: TokenStorageService,
    private router: Router,
    public notificationService: NotificationService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // S'abonner aux notifications avec gestion des erreurs
    this.notificationSubscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.loadNotifications();
        console.log('Notification update received in header component:', notifications);
      },
      (error) => {
        console.error('Error in notification subscription:', error);
      }
    );
    
    // Vérifier périodiquement l'état de la connexion WebSocket
    this.checkConnectionInterval = setInterval(() => {
      const isConnected = this.notificationService.isConnected();
      if (!isConnected) {
        console.log('WebSocket not connected, attempting to reconnect...');
        // Optionnel: vous pouvez essayer de vous reconnecter ici
      }
    }, 10000); // Vérifier toutes les 10 secondes
    
    // Vérification du token et récupération des informations utilisateur
    this.isLoggedIn = !!this.tokenStorageService.getToken();
  
    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();
      console.log('User Data:', user);
  
      this.role = user.role || '';
      this.username = user.username;
      this.email = user.email || 'Non spécifié';
      this.numeroIdentificationEntreprise = user.numeroIdentificationEntreprise || '';
      
      console.log('Role:', this.role);
      console.log('Username:', user.username);
  
      this.showFournisseurDashboard = this.role === 'ROLE_FOURNISSEUR';
      this.showClientDashboard = this.role === 'ROLE_CLIENT';
    }
  
    this.updateProfileIcon();
  }

  // Méthode pour charger toutes les notifications et les séparer en lues/non lues
  loadNotifications() {
    const user = this.tokenStorageService.getUser();
    if (!user || !user.id) return;

    // Charger les notifications non lues
    this.notificationService.getUnreadNotificationsByUser(user.id).subscribe((data: any) => {
      this.unreadNotifications = data;
      console.log("Unread notifications:", this.unreadNotifications);
    });

    // Charger les notifications lues
    this.notificationService.getReadNotificationsByUser(user.id).subscribe((data: any) => {
      this.readNotifications = data;
      console.log("Read notifications:", this.readNotifications);
    });

    // Charger toutes les notifications (pour compatibilité avec le code existant)
    this.notificationService.getAllNotifications(user.id).subscribe((data: any) => {
      this.allNotifications = data;
      this.notifications = []; // Réinitialiser la liste
      for (let i = 0; i < this.allNotifications.length; i++) {
        this.notifications.push(this.allNotifications[i].message + ' ' + this.allNotifications[i].createdAt);
      }
      console.log("All notifications:", this.allNotifications);
    });
  }
  
  updateProfileIcon() {
    console.log("isLoggedIn:", this.isLoggedIn);
  
    const profileIcon = this.el.nativeElement.querySelector('.profile-icon');
    if (!profileIcon) {
      console.log("Profil icon not found");
      return;
    }
  
    if (this.isLoggedIn) {
      console.log("Hiding profile icon");
      this.renderer.removeClass(profileIcon, 'affichageIcon');
    } else {
      console.log("Displaying profile icon");
      this.renderer.addClass(profileIcon, 'affichageIcon'); 
    }
  }
  
  // Méthode pour envoyer une notification de test
  sendTestNotification(): void {
    console.log('Sending test notification...');
    const testMessage = 'Test notification from header component: ' + new Date().toLocaleTimeString();
    this.notificationService.sendMessage(testMessage);
  }
  
  // Méthode pour effacer toutes les notifications
  clearNotifications(): void {
    console.log('Clearing all notifications');
    this.notificationService.clearNotifications();
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    
    // Clear the interval
    if (this.checkConnectionInterval) {
      clearInterval(this.checkConnectionInterval);
    }
  }
  
  // Méthode pour marquer toutes les notifications comme lues
  markAllAsRead(): void {
    const user = this.tokenStorageService.getUser();
    if (!user || !user.id) return;

    this.notificationService.markAllAsRead().subscribe(() => {
      console.log('All notifications marked as read');
      this.loadNotifications(); // Recharger les notifications pour mettre à jour l'UI
    });
  }

  toggleNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    console.log('Dropdown is now:', this.isNotificationDropdownOpen ? 'open' : 'closed');
    
    // Si le dropdown est ouvert, marquer toutes les notifications comme lues
    if (this.isNotificationDropdownOpen && this.unreadNotifications.length > 0) {
      this.markAllAsRead();
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    const notificationIcon = this.el.nativeElement.querySelector('.notification-icon');
    if (notificationIcon && !notificationIcon.contains(event.target as Node)) {
      this.isNotificationDropdownOpen = false;
    }
  }

  // Méthodes de redirection existantes
  redirectToCreateArticle() { this.router.navigate(['createArticle']); }
  redirectToArticle(): void { this.router.navigate(['/article']); }
  redirectToCreatePack() { this.router.navigate(['/createPack']); }
  redirectToPack(): void { this.router.navigate(['/pack']); }
  redirectToListCommande(): void { this.router.navigate(['/listCommande']); }
  redirectToCommande(): void { this.router.navigate(['/commande']); }
  redirectToListCommandeParFR(): void { this.router.navigate(['/listCommande']); }

  logout(): void {
    this.tokenStorageService.signOut();
    this.isLoggedIn = false;
    this.router.navigate(['/accueil']).then(() => {
      window.location.reload();
    });    
  }

  // Méthode pour encoder le nom du fichier
  encodePhotoName(name: string): string {
    return decodeURIComponent(name);
  }
}