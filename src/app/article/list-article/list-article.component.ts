import { AfterViewChecked, AfterViewInit, Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';
import { Router } from '@angular/router';
import { StockService } from 'src/app/panier/stock.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SearchDataService } from 'src/app/services/search-data.service';
import { CategoryService } from 'src/app/category/category.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { FournisseurService } from 'src/app/services/fournisseur.service';
import { ChatbotService, Message } from 'src/app/services/chatbot.service';
export interface FeaturedImage {
  url: string;
  alt?: string;
}
@Component({
  selector: 'app-list-article',
  templateUrl: './list-article.component.html',
  styleUrls: ['./list-article.component.css']
})
export class ListArticleComponent implements OnInit ,AfterViewInit,AfterViewChecked {
  allArticles: Article[] = []; // Liste des articles
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null; 
  selectedPointure: Pointure | null = null; 
  selectedPointures: Pointure[] = []; 
  stockDisponible: number | null = null; 
  stockInsuffisant: boolean = false;
  selectedCategory: any = null;
  activeIndexes: { [key: number]: number } = {};
  // Nouvel objet pour suivre le statut du stock de chaque pointure
  pointureOutOfStock: { [id: number]: boolean } = {};
  searchResults: any[] = [];
  aiResponse: string = '';
  isSearchMode: boolean = false;
  isSearchLoading: boolean = false;
  activePhotoIndex: number | undefined;
  showFullDescription: boolean = false;
  favorisArticles: number[] = []; // stocke les IDs des articles favoris
  favorisIds: number[] = [];
  articlesWithFavoritesCount: { [articleId: number]: number } = {};

  favoritesStatus: { [articleId: number]: boolean } = {};
  favoritesLoading = true;

  showTitle: boolean = false;
  showSubtitle: boolean = false;
  showButtons: boolean = false;

  activeSlideIndex: number = 0;

  allFournisseurs: any[] = []; // Liste des fournisseurs acceptés

  top10NewArticles: Article[] = []; // Pour stocker les 10 nouveaux articles
  displayedNewArticles: Article[] = [];
  showFirstGroup: boolean = true;
  isAnimating: boolean = false;
  animationInterval: any;
  // Variables de pagination
  currentPage: number = 0;
  articleGroups: any[][] = [];
  articlesPerPage: number = 19; // Nombre d'articles par page
  animateIn: boolean = true;
  animateOut: boolean = false;

  
  // Nouvelle propriété pour l'image featured
  featuredImage: FeaturedImage = {
    url: 'assets/botte1.jpg', // Votre image comme dans l'exemple
    alt: 'Chaussures enfant'
  };

  // Position où afficher l'image featured (0 = première position, 1 = deuxième position, etc.)
  featuredImagePosition: number = 5; // Deuxième carte

  // Page où afficher l'image featured
  featuredImagePage: number = 0; // Première page
 // Propriétés pour le chatbot
  userMessage = '';
  messages: Message[] = [];
  isLoading = true;
  isChatbotOpen = false;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(
    private articleService: ArticleService,
    private panierService: PanierService,
    private router: Router,
    private stockService: StockService,
    private searchDataService: SearchDataService,
    private categoryService: CategoryService,
    private favorisService: FavorisService ,
    private tokenStorage: TokenStorageService ,// Ajoutez cette ligne
    private ngZone: NgZone , // Ajoutez cette ligne,
    private fournisseurService: FournisseurService,
    private chatbotService: ChatbotService


    
  ) {}
// Pour les effets d'animation entre pages
prepareArticleGroups(): void {
  const articles = this.isSearchMode ? this.searchResults : this.allArticles;
  this.articleGroups = [];
  
  // Diviser les articles en groupes de taille articlesPerPage
  for (let i = 0; i < articles.length; i += this.articlesPerPage) {
    this.articleGroups.push(articles.slice(i, i + this.articlesPerPage));
  }
  
  // S'assurer qu'il y a au moins un groupe même s'il est vide
  if (this.articleGroups.length === 0) {
    this.articleGroups = [[]];
  }
}
ngAfterViewChecked() {
  if (this.isChatbotOpen) {
    this.scrollToBottom();
  }
}
ngOnInit(): void {
   // Initialisation du chatbot
   this.initializeChatbot();

    this.startTextAnimations();

    this.getArticlesWithStatut('ACCEPTE');
  
    this.searchDataService.searchResults$.subscribe(results => {
      console.log('Résultats de recherche reçus dans le composant:', results);
      this.searchResults = results;
    });
  
    this.searchDataService.aiResponse$.subscribe(message => {
      console.log('Message IA reçu :', message);
      this.aiResponse = message;
    });
  
    this.searchDataService.searchActive$.subscribe(active => {
      console.log('Mode recherche actif :', active);
      this.isSearchMode = active;
    });
  
    this.searchDataService.loading$.subscribe(loading => {
      console.log('Chargement en cours :', loading);
      this.isSearchLoading = loading;
    });

    
    this.favorisService.getFavoris().subscribe({
      next: (favoris) => {
        this.favorisIds = favoris.map(f => f.article.id); // ou f.id si c'est l'article directement
        setTimeout(() => this.loadFavoritesCount(), 500);

      },
      error: (err) => {
        console.error('Erreur lors de la récupération des favoris :', err);
      }
    });
    this.loadFavoriteStatus();

    this.allArticles.forEach(article => {
      this.activeIndexes[article.id] = 0;
    });

      // Préparation des groupes d'articles
  setTimeout(() => {
    this.prepareArticleGroups();
  }, 500);
  
  // Surveillance des changements dans les résultats de recherche
  this.searchDataService.searchResults$.subscribe(results => {
    console.log('Résultats de recherche reçus dans le composant:', results);
    this.searchResults = results;
    this.prepareArticleGroups(); // Mettre à jour les groupes
    this.currentPage = 0; // Revenir à la première page
  });


  this.getAllFournisseursAcceptes();
  this.searchDataService.searchResults$.subscribe(results => {
    console.log('Résultats de recherche reçus dans le composant:', results);
    this.searchResults = results;
  });

  this.searchDataService.aiResponse$.subscribe(message => {
    console.log('Message IA reçu :', message);
    this.aiResponse = message;
  });

  this.searchDataService.searchActive$.subscribe(active => {
    console.log('Mode recherche actif :', active);
    this.isSearchMode = active;
  });


  this.getTop10NewArticles();
    
  // Démarrer l'animation après un délai initial
  setTimeout(() => {
    this.startNewArticlesAnimation();
  }, 3000); // Attendre 3 secondes avant de commencer l'animation
}

  // Mettre à jour les groupes lorsque les articles changent
ngOnChanges(): void {
  this.prepareArticleGroups();
}
// Mettez à jour ces trois méthodes dans votre composant (nextPage, previousPage et goToPage)
// et ajoutez la nouvelle méthode getArticlesContainerTop

// Navigation entre les pages avec défilement automatique
nextPage(): void {
  if (this.currentPage < this.articleGroups.length - 1) {
    this.animateOut = true;
    this.animateIn = false;
    
    setTimeout(() => {
      this.currentPage++;
      
      // Faire défiler vers le haut pour voir les nouveaux articles
      this.scrollToArticles();
      
      setTimeout(() => {
        this.animateOut = false;
        this.animateIn = true;
      }, 50);
    }, 300);
  }
}

previousPage(): void {
  if (this.currentPage > 0) {
    this.animateOut = true;
    this.animateIn = false;
    
    setTimeout(() => {
      this.currentPage--;
      
      // Faire défiler vers le haut pour voir les nouveaux articles
      this.scrollToArticles();
      
      setTimeout(() => {
        this.animateOut = false;
        this.animateIn = true;
      }, 50);
    }, 300);
  }
}

// Aller directement à une page spécifique avec défilement
goToPage(pageIndex: number): void {
  if (pageIndex !== this.currentPage && pageIndex >= 0 && pageIndex < this.articleGroups.length) {
    this.animateOut = true;
    this.animateIn = false;
    
    setTimeout(() => {
      this.currentPage = pageIndex;
      
      // Faire défiler vers le haut pour voir les nouveaux articles
      this.scrollToArticles();
      
      setTimeout(() => {
        this.animateOut = false;
        this.animateIn = true;
      }, 50);
    }, 300);
  }
}

// Méthode pour faire défiler vers les articles de manière fluide
scrollToArticles(): void {
  const container = document.querySelector('.articles-grid-container');
  if (container) {
    const topPosition = container.getBoundingClientRect().top + window.pageYOffset - 20;
    window.scrollTo({ 
      top: topPosition, 
      behavior: 'smooth' 
    });
  }
}

  ngAfterViewInit(): void {
    this.updateParallax(); // Initialiser
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.ngZone.runOutsideAngular(() => {
      this.updateParallax();
    });  }
  updateParallax(): void {
    const parallaxBgs = document.querySelectorAll<HTMLElement>('.parallax-bg');
    const windowHeight = window.innerHeight;
  
    parallaxBgs.forEach(bg => {
      const section = bg.parentElement as HTMLElement;
      const sectionTop = section.getBoundingClientRect().top;
  
      if (sectionTop < windowHeight && sectionTop > -windowHeight) {
        // Limiter le déplacement vertical pour éviter l'écart croissant
        const yOffset = Math.min(sectionTop * 0.3, 100); // Réduire le facteur et limiter la valeur maximale
        bg.style.transform = `translateZ(-1px) scale(1) translateY(${yOffset}px)`;
      }
    });
  }

  startTextAnimations(): void {
    // Afficher le titre après un court délai
    setTimeout(() => {
      this.showTitle = true;
      
      // Afficher le sous-titre après que le titre soit apparu
      setTimeout(() => {
        this.showSubtitle = true;
        
        // Afficher les boutons après que le sous-titre soit apparu
        setTimeout(() => {
          this.showButtons = true;
        }, 2500);
      }, 2000);
    }, 500);
  }
  
// Appelé lorsque le carousel change
onSlide(event: any, articleId: number): void {
  this.activeIndexes[articleId] = event.to;
}
  isLoggedIn(): boolean {
    const user = this.tokenStorage.getUser();
    return !!user && !!user.id;
  }

  loadFavoriteStatus(): void {
    this.favoritesLoading = true;
    
    // First, get all articles
    this.getArticlesWithStatut('ACCEPTE');
    
    // After articles are loaded, check favorites status
    this.articleService.getArticlesByStatut('ACCEPTE').subscribe({
      next: (articles) => {
        // Create an array of observables for checking favorite status
        const statusChecks = articles.map(article => 
          this.favorisService.isFavori(article.id).pipe(
            map(isFav => ({ articleId: article.id, isFavorite: isFav })),
            catchError(() => of({ articleId: article.id, isFavorite: false }))
          )
        );
        
        // Execute all checks in parallel
        forkJoin(statusChecks).subscribe({
          next: (results) => {
            // Convert array to object for easy lookup
            this.favoritesStatus = results.reduce((acc, curr) => {
              acc[curr.articleId] = curr.isFavorite;
              return acc;
            }, {} as {[articleId: number]: boolean});
            
            this.favoritesLoading = false;
          },
          error: () => {
            this.favoritesLoading = false;
          }
        });
      }
    });
  }
  
  loadFavoritesCount(): void {
    // Only fetch counts for articles that are loaded
    if (this.allArticles && this.allArticles.length > 0) {
      this.allArticles.forEach(article => {
        this.favorisService.getArticleFavorisCount(article.id).subscribe({
          next: (count) => {
            this.articlesWithFavoritesCount[article.id] = count;
          },
          error: (err) => {
            console.error(`Erreur lors du chargement du compteur de favoris pour l'article ${article.id}:`, err);
          }
        });
      });
    }
  }
  getFavoriteCount(articleId: number): number {
    return this.articlesWithFavoritesCount[articleId] || 0;
  }

  
  // Replace your existing isFavorite method with this one
  isFavorite(articleId: number): boolean {
    // First check the server-validated status
    if (this.favoritesStatus[articleId] !== undefined) {
      return this.favoritesStatus[articleId];
    }
    // Fall back to the local array if server status hasn't loaded yet
    return this.favorisIds.includes(articleId);
  }
  
  // Update toggleFavoris to maintain favorite status sync
  toggleFavoris(article: Article): void {
    if (!this.isLoggedIn()) {
      // Rediriger vers la page de connexion avec l'URL de retour
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }
    this.favorisService.toggleFavori(article.id).subscribe({
      next: (response) => {
        if (response && response.error) {
          console.error('Erreur:', response.error);
          alert(response.error);
          return;
        }
        // Update both local arrays to maintain consistency
        const isFav = !this.isFavorite(article.id);
        this.favoritesStatus[article.id] = isFav;
        
        const index = this.favorisIds.indexOf(article.id);
        if (index > -1 && !isFav) {
          this.favorisIds.splice(index, 1);
        } else if (index === -1 && isFav) {
          this.favorisIds.push(article.id);
        }
        this.loadFavoritesCount();

      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour des favoris:', err);
      }
    });
  }
  handleFavoriteClick(article: Article, event: Event): void {
    if (event) {
      event.stopPropagation(); // Empêcher la propagation du clic
    }
    this.toggleFavoris(article);
  }
  
  isNewArticle(article: any) {
    if (!article.createdAt) return false;
    const creationDate = new Date(article.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - creationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }
  
// Ajoutez ces méthodes au composant
setActivePhoto(index: number): void {
  this.activePhotoIndex = index;
}

showAllPhotos(): void {
  // Cette méthode pourrait ouvrir une galerie d'images plus complète
  // Pour l'instant, nous allons simplement afficher la première image
  this.activePhotoIndex = 0;
}

// N'oubliez pas d'ajouter cette référence Math dans votre template
// Pour rendre le calcul de remise possible
get Math() { 
  return Math; 
}

  resetSearch(): void {
    this.searchDataService.clearSearchResults();
  }
  selectCouleur(couleur: Couleur) {
    this.selectedCouleur = couleur;
    this.stockInsuffisant = false;
    this.selectedPointure = null;
    this.pointureOutOfStock = {}; // Réinitialiser le statut de stock des pointures
    
    console.log("Couleur sélectionnée:", couleur.nom);
  
    if (this.selectedArticle && this.selectedArticle.stocks?.length) {
      // Filtrer les pointures disponibles pour cette couleur
      this.selectedPointures = this.selectedArticle.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      console.log("Pointures disponibles:", this.selectedPointures);
      
      // Vérifier le stock pour chaque pointure
      this.checkStockForAllSizes();
    } else {
      this.selectedPointures = [];
      console.log("Aucune pointure disponible pour cette couleur!");
    }
  }
  
  // Nouvelle méthode pour vérifier le stock de toutes les pointures
  checkStockForAllSizes(): void {
    if (!this.selectedArticle || !this.selectedCouleur || this.selectedPointures.length === 0) {
      return;
    }
    
    // Créer un tableau de requêtes pour vérifier le stock de chaque pointure
    const stockRequests = this.selectedPointures.map(pointure => 
      this.stockService.getStockQuantity(
        this.selectedArticle!.id,
        this.selectedCouleur!.id,
        pointure.id
      ).pipe(
        catchError(err => {
          console.error(`Erreur lors de la vérification du stock pour la pointure ${pointure.taille}:`, err);
          return of(0); // En cas d'erreur, considérer que le stock est 0
        })
      )
    );
    
    // Exécuter toutes les requêtes en parallèle
    forkJoin(stockRequests).subscribe(results => {
      // Mettre à jour le statut de stock pour chaque pointure
      this.selectedPointures.forEach((pointure, index) => {
        const stockQuantity = results[index];
        this.pointureOutOfStock[pointure.id] = stockQuantity <= 0;
      });
      
      console.log("Statut du stock des pointures:", this.pointureOutOfStock);
    });
  }
  
  selectPointure(pointure: Pointure) {
    // Ne rien faire si la pointure est en rupture de stock
    if (this.pointureOutOfStock[pointure.id]) {
      return;
    }
    
    this.selectedPointure = pointure;
    this.stockInsuffisant = false;
    
    // Vérifier le stock disponible pour la combinaison article/couleur/pointure
    if (this.selectedArticle && this.selectedCouleur) {
      this.stockService.getStockQuantity(
        this.selectedArticle.id,
        this.selectedCouleur.id,
        pointure.id
      ).subscribe({
        next: (quantite) => {
          this.stockDisponible = quantite;
          console.log(`Stock disponible: ${quantite} unités`);
          
          // Marquer comme indisponible si le stock est ≤ 0
          if (quantite <= 0) {
            this.stockInsuffisant = true;
            this.pointureOutOfStock[pointure.id] = true;
          }
        },
        error: (err) => {
          console.error("Erreur lors de la vérification du stock:", err);
          this.stockInsuffisant = true;
          this.pointureOutOfStock[pointure.id] = true;
        }
      });
    }
  }

  getUniqueColors(stocks: any[]): Couleur[] {
    const couleursUniques = [...new Set(stocks.map(stock => stock.couleur.id))];
    return couleursUniques.map(id => stocks.find(stock => stock.couleur.id === id)?.couleur);
  }
  
  ouvrirModal(article: Article): void {
    this.selectedArticle = article;
    this.selectedCouleur = null;
    this.selectedPointures = [];
    this.selectedPointure = null;
    this.stockDisponible = null;
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
    this.activePhotoIndex = 0; // Réinitialiser l'index de photo actif
  
    console.log("Article sélectionné:", article);
    if (article.stocks && article.stocks.length > 0) {
      console.log("Stock de l'article:", article.stocks);
    } else {
      console.log("Aucune couleur ou pointure disponible pour cet article!");
    }
  }
  
  toggleFullDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }
  getArticlesWithStatut(statut: string): void {
    this.articleService.getArticlesByStatut(statut).subscribe({
      next: (data) => {
        this.allArticles = data;
      },
      error: (err) => {
        console.error('Error fetching articles', err);
      }
    });
  }
  
  getArticlesAjoutesAujourdhui(): void {
    this.articleService.getArticlesAujourdhui().subscribe({
      next: (data) => {
        this.allArticles = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des articles:', err);
      }
    });
  }
  
  confirmerAjoutAuPanier(): void {
    if (!this.selectedArticle) {
      alert("Aucun article sélectionné!");
      return;
    }
  
    if (!this.selectedCouleur) {
      alert("Veuillez sélectionner une couleur!");
      return;
    }
  
    if (!this.selectedPointure) {
      alert("Veuillez sélectionner une pointure!");
      return;
    }

    // Vérification du stock
    if (this.stockInsuffisant || this.pointureOutOfStock[this.selectedPointure.id]) {
      alert("Stock insuffisant pour cet article dans la couleur et pointure sélectionnées!");
      return;
    }
  
    this.panierService.ajouterAuPanier(this.selectedArticle, this.selectedCouleur, this.selectedPointure);
    alert(`${this.selectedArticle.name} ajouté au panier!`);
    
    this.selectedArticle = null; // Fermer le modal
  }
  
  voirDetailsArticle(article: Article): void {
    // Stocker l'URL actuelle comme URL précédente
    localStorage.setItem('previousUrl', this.router.url);
    
    // Naviguer vers la page détaillée
    this.router.navigate(['/detailArticle', article.id]);
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



  
  loadFavoris(): void {
    this.favorisService.getFavoris().subscribe({
      next: (favoris: Article[]) => {
        this.favorisArticles = favoris.map(f => f.id);
      },
      error: err => console.error('Erreur lors du chargement des favoris:', err)
    });
  }
    

  getNomCouleur(couleurCode: string): string {
    const mapCouleurs: { [key: string]: string } = {
      '#3c2313': 'marron',
      '#ffffff': 'blanc',
      '#000000': 'noir',
      // ajoute d'autres couleurs si nécessaire
    };
    return mapCouleurs[couleurCode] || couleurCode;
  }
  

  shouldShowFeaturedImage(index: number): boolean {
    return (
      this.currentPage === this.featuredImagePage && 
      index === this.featuredImagePosition
    );
  }

  /**
   * Met à jour l'image featured
   */
  updateFeaturedImage(imageUrl: string, alt?: string): void {
    this.featuredImage = {
      url: imageUrl,
      alt: alt || 'Image mise en avant'
    };
  }

  /**
   * Change la position de l'image featured
   */
  setFeaturedImagePosition(position: number, page: number = 0): void {
    this.featuredImagePosition = position;
    this.featuredImagePage = page;
  }

  /**
   * Active/désactive l'affichage de l'image featured
   */
  toggleFeaturedImage(show: boolean): void {
    if (show) {
      this.featuredImagePosition = 1; // Position par défaut
    } else {
      this.featuredImagePosition = -1; // Position invalide pour cacher
    }
  }
  

  getAllFournisseursAcceptes(): void {
    this.fournisseurService.getAllFournisseursAcceptes().subscribe({
      next: (data) => {
        this.allFournisseurs = data;
        console.log('Fournisseurs acceptés récupérés:', this.allFournisseurs);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des fournisseurs acceptés:', err);
      }
    });
  }
  
  // 4. Ajoutez cette méthode pour voir les détails d'un fournisseur
  voirFournisseur(fournisseur: any): void {
    // Vous pouvez naviguer vers une page de détail du fournisseur
    // ou filtrer les articles par fournisseur
    console.log('Voir fournisseur:', fournisseur);
    // Exemple : this.router.navigate(['/fournisseur', fournisseur.id]);
  }
  
  ngOnDestroy(): void {
    // Nettoyer l'intervalle quand le composant est détruit
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }
// Méthode pour récupérer les 10 nouveaux articles acceptés (modifiée)
getTop10NewArticles(): void {
  this.articleService.getTop10NewAcceptedArticles().subscribe({
    next: (data) => {
      this.top10NewArticles = data;
      console.log('✅ 10 nouveaux articles récupérés:', data);
      
      // Initialiser avec les 5 premiers articles
      if (data.length > 0) {
        this.displayedNewArticles = data.slice(0, 5);
        this.showFirstGroup = true;
      }
    },
    error: (err) => {
      console.error('❌ Erreur lors de la récupération des nouveaux articles:', err);
    }
  });
}

// Nouvelle méthode pour démarrer l'animation cyclique
startNewArticlesAnimation(): void {
  if (this.top10NewArticles.length <= 5) {
    return; // Pas besoin d'animation s'il y a 5 articles ou moins
  }

  this.animationInterval = setInterval(() => {
    this.switchArticleGroups();
  }, 5000); // Changer toutes les 5 secondes
}

// Méthode pour alterner entre les groupes d'articles
switchArticleGroups(): void {
  if (this.isAnimating || this.top10NewArticles.length <= 5) {
    return;
  }

  this.isAnimating = true;

  // Animation de sortie (fade out)
  setTimeout(() => {
    // Changer le groupe d'articles
    if (this.showFirstGroup) {
      // Afficher les articles 6-10 (index 5-9)
      this.displayedNewArticles = this.top10NewArticles.slice(5, 10);
    } else {
      // Afficher les articles 1-5 (index 0-4)
      this.displayedNewArticles = this.top10NewArticles.slice(0, 5);
    }
    
    this.showFirstGroup = !this.showFirstGroup;

    // Animation d'entrée (fade in) après un court délai
    setTimeout(() => {
      this.isAnimating = false;
    }, 100);
  }, 300);
}

// Méthode pour arrêter l'animation (optionnelle, pour le contrôle utilisateur)
stopNewArticlesAnimation(): void {
  if (this.animationInterval) {
    clearInterval(this.animationInterval);
    this.animationInterval = null;
  }
}

// Méthode pour redémarrer l'animation (optionnelle)
restartNewArticlesAnimation(): void {
  this.stopNewArticlesAnimation();
  this.startNewArticlesAnimation();
}


  // Méthodes pour le chatbot
  initializeChatbot(): void {
    // S'abonner aux messages du chatbot
    this.chatbotService.messages$.subscribe(messages => {
      this.messages = messages;
    });
        
    // Vérifier si le modèle est chargé
    this.chatbotService.isModelLoaded().subscribe(loaded => {
      this.isLoading = !loaded;
      if (loaded) {
        // Ajouter un message de bienvenue
        this.chatbotService.sendMessage('Bonjour');
      }
    });
  }

  toggleChatbot(): void {
    this.isChatbotOpen = !this.isChatbotOpen;
  }

  scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { 
      console.error('Erreur lors du scroll:', err);
    }
  }

  sendChatMessage(): void {
    if (this.userMessage.trim() === '') return;
        
    this.chatbotService.sendMessage(this.userMessage);
    this.userMessage = '';
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendChatMessage();
    }
  }
  scrollToChatbot() {
    const chatbotSection = document.getElementById('chatbot-section');
    if (chatbotSection) {
      chatbotSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}