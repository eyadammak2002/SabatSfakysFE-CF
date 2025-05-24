import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { Article } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
import { CategoryService } from 'src/app/category/category.service';
import { AIService } from 'src/app/services/ai.service';
import { NotificationEntity, NotificationService } from 'src/app/services/notification.service';
import { PanierService } from 'src/app/services/panier.service';
import { SearchDataService } from 'src/app/services/search-data.service';
import { SearchResponse, SearchService } from 'src/app/services/search.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
declare var global: any;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})

export class HeaderComponent implements OnInit , OnDestroy, AfterViewInit {
  private timer: any;
  private currentIndex = 0;
  private images!: HTMLCollectionOf<Element>;
  
  showFournisseurDashboard = false;
  showClientDashboard = false;
  isLoggedIn: boolean = false;
  notifications: string[] = [];
  private notificationSubscription: Subscription = new Subscription();
  private checkConnectionInterval: any;
  role: string = '';
  role2: string = '';
  username?: string;
  email?: string; 
  fournisseurLogo: string = '';
  numeroIdentificationEntreprise?: string; 
  isNotificationDropdownOpen = false;
  allNotifications: NotificationEntity[] = [];
  unreadNotifications: NotificationEntity[] = [];
  readNotifications: NotificationEntity[] = [];
// Propriétés pour le filtrage
  filteredArticles: Article[] = [];
  isLoading: boolean = false;
  currentCategory: string = '';
  currentGenre: string = '';
  selectedCategory: any = null;

  searchQuery: string = '';
  aiResponse: string = '';
  searchResults: any[] = [];
  showResults: boolean = false;
  
  private searchTerms = new Subject<string>();


  constructor(
    private tokenStorageService: TokenStorageService,
    private router: Router,
    public panierService:PanierService,
    public notificationService: NotificationService,
    private renderer: Renderer2,
    private el: ElementRef,
    private articleService: ArticleService, 
    private categoryService: CategoryService ,
    private aiService: AIService,
    private searchService: SearchService,
    private searchDataService: SearchDataService,
  ) {}

  ngAfterViewInit() {
    // Récupérer toutes les images du diaporama
    this.images = document.getElementsByClassName('banner-image');
    if (this.images.length > 0) {
      // Configurer le diaporama initial
      this.setupSlideshow();
      // Démarrer le diaporama
      this.startSlideshow();
    }
  }


  ngOnInit(): void {
    this.searchTerms.pipe(
          debounceTime(300),
          distinctUntilChanged()
        ).subscribe(term => {
          this.performSearch(term);
  });


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
      this.role2 = user.role2 || '';
      this.username = user.username;
      this.email = user.email || 'Non spécifié';
      this.numeroIdentificationEntreprise = user.numeroIdentificationEntreprise || '';
      this.checkUserRole();
      
      console.log('Role:', this.role);
      console.log('Role2:', this.role2);
      console.log('Username:', user.username);
  
      this.showFournisseurDashboard = this.role === 'ROLE_FOURNISSEUR';
      this.showClientDashboard = this.role === 'ROLE_CLIENT';
      //this.showClientDashboard = this.role2 === 'ROLE_CLIENT';
      
    }
  
    this.updateProfileIcon();
  }

 // Gestion de la saisie de l'utilisateur
 onSearchInput(event: any): void {
  const term = event.target.value.trim();
  this.searchQuery = term;
  
  if (term) {
    this.searchTerms.next(term);
  } else {
    this.searchResults = [];
    this.aiResponse = '';
    this.showResults = false;
  }
}

// Modifiez ces méthodes dans header.component.ts
performSearch(term: string): void {
  if (!term.trim()) return;
  
  this.isLoading = true;
  this.searchService.naturalLanguageSearch(term).subscribe({
    next: (response: SearchResponse) => {
      console.log('Réponse du service de recherche:', response);
      
      // Vérification et correction - utiliser articles au lieu de products
      const articles = response.articles || response.products || [];
      
      // Envoyer les résultats via le service partagé
      this.searchDataService.updateSearchResults(articles, response.message);
      this.isLoading = false;
      
      // Rediriger vers la page d'accueil si ce n'est pas déjà le cas
      if (this.router.url !== '/accueil') {
        this.router.navigate(['/accueil']);
      }
    },
    error: (error) => {
      console.error('Erreur lors de la recherche:', error);
      this.isLoading = false;
      // En cas d'erreur, initialiser avec un tableau vide
      this.searchDataService.updateSearchResults([], 'Une erreur est survenue lors de la recherche.');
    }
  });
}

performStandardSearch(): void {
  if (!this.searchQuery.trim()) return;
  
  this.isLoading = true;
  this.searchService.searchByKeyword(this.searchQuery).subscribe({
    next: (results) => {
      console.log('Résultats de la recherche standard:', results);
      
      // S'assurer que results est un tableau
      const articles = Array.isArray(results) ? results : [];
      
      // Envoyer les résultats via le service partagé
      this.searchDataService.updateSearchResults(articles, `Résultats pour: "${this.searchQuery}"`);
      this.isLoading = false;
      
      // Rediriger vers la page d'accueil si ce n'est pas déjà le cas
      if (this.router.url !== '/accueil') {
        this.router.navigate(['/accueil']);
      }
    },
    error: (error) => {
      console.error('Erreur lors de la recherche standard:', error);
      this.isLoading = false;
      // En cas d'erreur, initialiser avec un tableau vide
      this.searchDataService.updateSearchResults([], `Aucun résultat pour: "${this.searchQuery}"`);
    }
  });
}

// Navigation vers la page de détail d'un produit
viewProductDetails(product: any): void {
  this.router.navigate(['/article', product.productId]);
  this.resetSearch();
}



// Méthode pour réinitialiser la recherche
resetSearch(): void {
  this.searchQuery = '';
  this.searchDataService.clearSearchResults();
  this.showResults = false;
}
  // Ajoutez cette méthode dans HeaderComponent
checkUserRole(): void {
  if (this.isLoggedIn) {
    const user = this.tokenStorageService.getUser();
    
    // Vérifier si c'est un fournisseur connecté via login client
    if (user.roles && user.roles.includes('ROLE_FOURNISSEUR') && this.router.url.includes('/client')) {
      console.log('Fournisseur connecté en tant que client');
      // Forcer l'affichage de l'espace client
      this.showClientDashboard = true;
      this.showFournisseurDashboard = false;
      this.role = 'ROLE_CLIENT';
      this.role2 = 'ROLE_FOURNISSEUR';
      
      // Mise à jour dans le stockage
      user.role = 'ROLE_CLIENT';
      user.role2 = 'ROLE_FOURNISSEUR';
      this.tokenStorageService.saveUser(user);
    }
  }
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

    this.stopSlideshow();

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
    
    // Store previous state to check if we're closing the dropdown
    const wasOpen = this.isNotificationDropdownOpen;
    
    // Toggle dropdown state
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    console.log('Dropdown is now:', this.isNotificationDropdownOpen ? 'open' : 'closed');
    
    // If dropdown was open and now it's closed, refresh the page
    if (wasOpen && !this.isNotificationDropdownOpen) {
      window.location.reload();
    }
    
    // If the dropdown is opened, mark all notifications as read
    if (this.isNotificationDropdownOpen && this.unreadNotifications.length > 0) {
      this.markAllAsRead();
    }
  }

  
  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    const notificationIcon = this.el.nativeElement.querySelector('.notification-icon');
    if (notificationIcon && !notificationIcon.contains(event.target as Node)) {
      // Check if dropdown was open before closing it
      const wasOpen = this.isNotificationDropdownOpen;
      this.isNotificationDropdownOpen = false;
      
      // If dropdown was open and now it's being closed, refresh the page
      if (wasOpen) {
        this.loadNotifications();
      }
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
  redirectToProfile(): void {
    if (this.email) {
      this.router.navigate(['/profile'], { queryParams: { email: this.email } });
    } else {
      console.error('Email non disponible pour la redirection vers le profil.');
      // Eventuellement afficher un message à l'utilisateur
    }
  }
  
  redirectToProfileFR(): void {
    if (this.email) {
      this.router.navigate(['/profileFR'], { queryParams: { email: this.email } });
    } else {
      console.error('Email non disponible pour la redirection vers le profil.');
      // Eventuellement afficher un message à l'utilisateur
    }
  }

  redirectToListReclamation(): void { this.router.navigate(['/mes-reclamations']);}


    logout(): void {
       // Réinitialiser l'adresse de livraison dans le panier actif
    this.panierService.resetAdresseLivraison();
    
    // Vider le panier courant
    this.panierService.viderPanier();
    
    // Supprimer l'entrée spécifique du panier invité dans localStorage
    localStorage.removeItem('guest_cart');
    
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

  /*etCommandeById(){
    this.panierService.getPanierById(id).subscribe({
      next: (panier) => {
        console.log('✅ Panier reçu :', panier);
        this.panier = panier;
      },
      error: (err) => {
        console.error('❌ Erreur lors de la récupération du panier :', err);
      }
    });
  }*/

   
  
    redirectToClient() { 
      // Update the display flags
      this.showClientDashboard = true;
      this.showFournisseurDashboard = false;
      
      // Get current user
      const user = this.tokenStorageService.getUser();
      
      if (user) {
        // Save original role to role2 if needed for switching back
        user.role2 = user.role;  // Save original role
        user.role = 'ROLE_CLIENT'; 
        
        // Update user in storage
        this.tokenStorageService.saveUser(user);
        
        // Update local variables
        this.role = 'ROLE_CLIENT';
        this.role2 = 'ROLE_FOURNISSEUR';  // Keep track of original role
      }
      
      // Redirect to client home page
      this.router.navigate(['/accueil']);
    }


    redirectToFR() { 
      // Update display flags
      this.showClientDashboard = false;
      this.showFournisseurDashboard = true;
      
      // Get current user
      const user = this.tokenStorageService.getUser();
      
      // Restore original supplier role
      if (user) {
        // If role2 exists, use it (it should be ROLE_FOURNISSEUR)
        if (user.role2) {
          user.role = user.role2;
        } else {
          user.role = 'ROLE_FOURNISSEUR';
        }
        
        // Update user in storage
        this.tokenStorageService.saveUser(user);
        
        // Update local variables
        this.role = 'ROLE_FOURNISSEUR';
      }
      
      // Redirect to supplier articles page
      this.router.navigate(['/listCommandeFR']);
    }


/*  redirectToFR()
  { this.showClientDashboard=false;
    this.showFournisseurDashboard=true;
    this.router.navigate(['/article']);
  }*/

    // Méthode pour charger une catégorie par son nom
  loadCategoryByName(categoryName: string): void {
    const id = this.getCategoryId(categoryName);
  
    if (id === 0) {
      console.error('Catégorie inconnue:', categoryName);
      return;
    }
  
    this.categoryService.getById(id).subscribe({
      next: (category) => {
        console.log('Catégorie récupérée:', category);
        this.selectedCategory = category;
        
        // Une fois la catégorie chargée, naviguer vers la page de filtrage
        this.router.navigate([`/${categoryName.toLowerCase()}`]);
        
        // Stocker les informations de catégorie en session storage
        sessionStorage.setItem('categoryId', id.toString());
        sessionStorage.setItem('categoryName', categoryName);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de la catégorie:', error);
      }
    });
  }

  // Modifiez la méthode filterByCategory dans header.component.ts

filterByCategory(categoryName: string, event?: Event): void {
  if (event) {
    event.preventDefault();
  }
  
  // Réinitialiser les filtres précédents
  sessionStorage.removeItem('filteredArticles');
  sessionStorage.removeItem('filterType');
  sessionStorage.removeItem('genreName');
  
  const categoryId = this.getCategoryId(categoryName);
  
  console.log(`Filtrage par catégorie: ${categoryName}, ID: ${categoryId}`);
  
  // Charger d'abord la catégorie
  this.categoryService.getById(categoryId).subscribe({
    next: (category) => {
      console.log('Catégorie récupérée:', category);
      this.selectedCategory = category;
      
      // Stocker les informations de catégorie en session storage
      sessionStorage.setItem('categoryId', categoryId.toString());
      sessionStorage.setItem('categoryName', categoryName);
      
      // Puis filtrer les articles
      this.articleService.getArticlesByCategorie(categoryId).subscribe({
        next: (articles) => {
          console.log(`Articles de la catégorie ${categoryName} (${articles.length} trouvés):`, articles);
          sessionStorage.setItem('filteredArticles', JSON.stringify(articles));
          sessionStorage.setItem('filterType', 'category');
          
          // Naviguer vers la page de la catégorie
          this.router.navigate([`/${categoryName.toLowerCase()}`]).then(() => {
            // Rafraîchir la page pour s'assurer que les nouveaux filtres sont appliqués
            // window.location.reload(); // Décommentez si nécessaire
          });
        },
        error: (error) => {
          console.error(`Erreur lors du filtrage des articles par catégorie ${categoryName}:`, error);
        }
      });
    },
    error: (error) => {
      console.error('Erreur lors de la récupération de la catégorie:', error);
    }
  });
}

  // Méthode pour filtrer les articles par genre
  filterByGenre(genre: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    this.articleService.getArticlesByGenre(genre).subscribe({
      next: (articles) => {
        console.log(`Articles du genre ${genre}:`, articles);
        sessionStorage.setItem('filteredArticles', JSON.stringify(articles));
        sessionStorage.setItem('filterType', 'genre');
        sessionStorage.setItem('genreName', genre);
        
        this.router.navigate([`/${genre.toLowerCase()}`]);
      },
      error: (error) => {
        console.error(`Erreur lors du filtrage des articles par genre ${genre}:`, error);
      }
    });
  }

  // Méthode pour filtrer par catégorie et genre
  filterByCategoryAndGenre(categoryName: string, genre: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const categoryId = this.getCategoryId(categoryName);
    
    // Charger d'abord la catégorie
    this.loadCategoryByName(categoryName);
    
    // Puis filtrer les articles par catégorie et genre
    this.articleService.filterArticles(categoryId, genre).subscribe({
      next: (articles) => {
        console.log(`Articles de la catégorie ${categoryName} et du genre ${genre}:`, articles);
        sessionStorage.setItem('filteredArticles', JSON.stringify(articles));
        sessionStorage.setItem('filterType', 'categoryAndGenre');
        sessionStorage.setItem('genreName', genre);
        
        this.router.navigate([`/${categoryName.toLowerCase()}/${genre.toLowerCase()}`]);
      },
      error: (error) => {
        console.error(`Erreur lors du filtrage des articles par catégorie ${categoryName} et genre ${genre}:`, error);
      }
    });
  }

  // Méthode pour filtrer par genre et catégorie (ordre inversé)
  filterByGenreAndCategory(genre: string, categoryName: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const categoryId = this.getCategoryId(categoryName);
    
    // Charger d'abord la catégorie
    this.loadCategoryByName(categoryName);
    
    // Puis filtrer les articles par genre et catégorie
    this.articleService.filterArticles(categoryId, genre).subscribe({
      next: (articles) => {
        console.log(`Articles du genre ${genre} et de la catégorie ${categoryName}:`, articles);
        sessionStorage.setItem('filteredArticles', JSON.stringify(articles));
        sessionStorage.setItem('filterType', 'genreAndCategory');
        sessionStorage.setItem('genreName', genre);
        
        this.router.navigate([`/${genre.toLowerCase()}/${categoryName.toLowerCase()}`]);
      },
      error: (error) => {
        console.error(`Erreur lors du filtrage des articles par genre ${genre} et catégorie ${categoryName}:`, error);
      }
    });
  }

  // Fonction utilitaire pour convertir le nom de catégorie en ID
  getCategoryId(categoryName: string): number {
    const categoryMap: {[key: string]: number} = {
      'chaussures': 1,
      'botte': 2,
      'mocassins': 3
    };
    
    return categoryMap[categoryName.toLowerCase()] || 0;
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) return;
    
    this.isLoading = true;
    this.aiService.generateResponse(this.searchQuery)
      .subscribe({
        next: (response) => {
          this.aiResponse = response.choices[0].message.content;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la génération de la réponse:', error);
          this.aiResponse = 'Une erreur est survenue lors de la communication avec l\'IA.';
          this.isLoading = false;
        }
      });
  }

  private setupSlideshow() {
    // Masquer toutes les images sauf la première
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i] as HTMLElement;
      if (i === 0) {
        img.style.display = 'block';
        img.style.opacity = '1';
      } else {
        img.style.display = 'none';
        img.style.opacity = '0';
      }
    }
  }

  private startSlideshow() {
    this.timer = setInterval(() => {
      this.showNextImage();
    }, 2000);
  }

  private stopSlideshow() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private showNextImage() {
    const currentImg = this.images[this.currentIndex] as HTMLElement;
    currentImg.style.display = 'none';
    
    // Avancer à l'image suivante
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    
    const nextImg = this.images[this.currentIndex] as HTMLElement;
    nextImg.style.display = 'block';
    
    // Animation de fondu
    setTimeout(() => {
      nextImg.style.opacity = '1';
    }, 50);
  }

}