import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
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
  isLoggedIn: boolean = false;  // Par défaut, l'utilisateur n'est pas connecté
  notifications: string[] = [];
  private notificationSubscription: Subscription = new Subscription();
  private checkConnectionInterval: any;
  role: string = '';
  username?: string;
  email?: string; 
  fournisseurLogo: string = '';
  numeroIdentificationEntreprise?: string; 

  constructor(
    private tokenStorageService: TokenStorageService,
    private router: Router,
    public notificationService: NotificationService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    // S'abonner aux notifications avec gestion des erreurs
    this.notificationSubscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        console.log('Notifications updated:', notifications);
        this.notifications = notifications;
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
      console.log('User Data:', user); // Vérifier les données de l'utilisateur
  
      // ✅ Stocker directement le rôle comme une chaîne
      this.role = user.role || '';
      this.username = user.username;
      this.email = user.email || 'Non spécifié';
      this.numeroIdentificationEntreprise = user.numeroIdentificationEntreprise || '';
      
      console.log('Role:', this.role); // Vérifier que le rôle est bien récupéré
      console.log('Username:', user.username);
  
      // ✅ Vérifier si l'utilisateur est un fournisseur
      this.showFournisseurDashboard = this.role === 'ROLE_FOURNISSEUR';
      // ✅ Vérifier si l'utilisateur est un client
      this.showClientDashboard = this.role === 'ROLE_CLIENT';
    }
  
    this.updateProfileIcon();
  }
  updateProfileIcon() {
    console.log("isLoggedIn:", this.isLoggedIn);  // Vérifie la valeur de isLoggedIn dans la console
  
    const profileIcon = this.el.nativeElement.querySelector('.profile-icon');
    if (!profileIcon) {
      console.log("Profil icon not found");  // Vérifie que l'élément existe dans le DOM
      return;
    }
  
    if (this.isLoggedIn) {
      // Afficher l'icône
      console.log("Hiding profile icon");
      this.renderer.removeClass(profileIcon, 'affichageIcon');  // Cacher l'icône
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
  
  redirectToCreateArticle() {
    this.router.navigate(['createArticle']);
  }

  redirectToArticle(): void {
    this.router.navigate(['/article']); // Redirige vers la page de création d'article
  }

  redirectToCreatePack() {
    this.router.navigate(['/createPack']);
  }

  redirectToPack(): void {
    this.router.navigate(['/pack']); // Redirige vers la page de création d'article
  }
  
  redirectToListCommande(): void {
    this.router.navigate(['/listCommande']); // Redirige vers la page de création d'article
  }
  
  redirectToCommande(): void {
    this.router.navigate(['/commande']); // Redirige vers la page de création d'article
  }
  
  redirectToListCommandeParFR(): void {
    this.router.navigate(['/listCommande']); // Redirige vers la page de création d'article
  }

  logout(): void {
    this.tokenStorageService.signOut();
    this.isLoggedIn = false;
    // Rediriger l'utilisateur vers la page d'accueil
    this.router.navigate(['/accueil']).then(() => {
      // Rafraîchir la page après la redirection
      window.location.reload();
    });    
  }

  // Méthode pour encoder le nom du fichier
  encodePhotoName(name: string): string {
    return decodeURIComponent(name);
  }
}