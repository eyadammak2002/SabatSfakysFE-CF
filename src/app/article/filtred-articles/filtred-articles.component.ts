import { AfterViewInit, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/category/category.service';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';
import { StockService } from 'src/app/panier/stock.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SearchDataService } from 'src/app/services/search-data.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-filtred-articles',
  templateUrl: './filtred-articles.component.html',
  styleUrls: ['./filtred-articles.component.css']
})
export class FiltredArticlesComponent implements OnInit, AfterViewInit {
  articles: Article[] = [];
  allArticles: Article[] = []; // Pour stocker tous les articles avant pagination
  isLoading: boolean = false;
  category: any = null;
  categoryName: string = '';
  genre: string = '';
  filterType: string = '';
  
  // Propriétés pour la gestion du panier
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null; 
  selectedPointure: Pointure | null = null; 
  selectedPointures: Pointure[] = []; 
  stockDisponible: number | null = null; 
  stockInsuffisant: boolean = false;
  pointureOutOfStock: { [id: number]: boolean } = {};

  // Gestion des favoris
  favorisArticles: number[] = [];
  favorisIds: number[] = [];
  articlesWithFavoritesCount: { [articleId: number]: number } = {};
  favoritesStatus: { [articleId: number]: boolean } = {};
  favoritesLoading = true;

  // Variables de pagination
  currentPage: number = 0;
  articleGroups: any[][] = [];
  articlesPerPage: number = 10; // Nombre d'articles par page
  animateIn: boolean = true;
  animateOut: boolean = false;

  // Variables d'animation
  showTitle: boolean = false;
  showSubtitle: boolean = false;
  showButtons: boolean = false;
  activeIndexes: { [key: number]: number } = {};

  // Nouvelles propriétés ajoutées depuis ListArticleComponent
  activePhotoIndex: number | undefined;
  showFullDescription: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private panierService: PanierService,
    private stockService: StockService,
    private searchDataService: SearchDataService,
    private favorisService: FavorisService,
    private tokenStorage: TokenStorageService,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.startTextAnimations();

    // Récupérer les paramètres de l'URL
    this.route.params.subscribe(params => {
      const categoryParam = params['category'];
      const genreParam = params['genre'];
      
      // Récupérer les données du sessionStorage
      const storedArticles = sessionStorage.getItem('filteredArticles');
      this.filterType = sessionStorage.getItem('filterType') || '';
      this.categoryName = sessionStorage.getItem('categoryName') || '';
      this.genre = sessionStorage.getItem('genreName') || '';
      
      if (storedArticles) {
        // Utiliser les articles stockés si disponibles
        this.allArticles = JSON.parse(storedArticles);
        this.prepareArticleGroups();
        
        // Si nous avons une catégorie, charger ses détails
        if (this.categoryName) {
          this.loadCategoryByName(this.categoryName);
        }
      } else {
        // Sinon, charger les articles en fonction des paramètres d'URL
        this.loadArticlesFromParams(categoryParam, genreParam);
      }
    });

    // Charger les favoris de l'utilisateur
    this.loadUserFavorites();

    // Initialiser les index actifs pour les carousels
    setTimeout(() => {
      this.allArticles.forEach(article => {
        this.activeIndexes[article.id] = 0;
      });
    }, 500);
  }

  ngAfterViewInit(): void {
    this.updateParallax();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.ngZone.runOutsideAngular(() => {
      this.updateParallax();
    });
  }

  updateParallax(): void {
    const parallaxBgs = document.querySelectorAll<HTMLElement>('.parallax-bg');
    const windowHeight = window.innerHeight;
  
    parallaxBgs.forEach(bg => {
      const section = bg.parentElement as HTMLElement;
      const sectionTop = section.getBoundingClientRect().top;
  
      if (sectionTop < windowHeight && sectionTop > -windowHeight) {
        const yOffset = Math.min(sectionTop * 0.3, 100);
        bg.style.transform = `translateZ(-1px) scale(1) translateY(${yOffset}px)`;
      }
    });
  }

  startTextAnimations(): void {
    setTimeout(() => {
      this.showTitle = true;
      
      setTimeout(() => {
        this.showSubtitle = true;
        
        setTimeout(() => {
          this.showButtons = true;
        }, 2500);
      }, 2000);
    }, 500);
  }

  // ========== NOUVELLES MÉTHODES AJOUTÉES ==========

  /**
   * Définit l'index de la photo active pour l'affichage
   * @param index - L'index de la photo à afficher
   */
  setActivePhoto(index: number): void {
    this.activePhotoIndex = index;
  }

  /**
   * Affiche toutes les photos (remet à la première photo)
   */
  showAllPhotos(): void {
    // Cette méthode pourrait ouvrir une galerie d'images plus complète
    // Pour l'instant, nous allons simplement afficher la première image
    this.activePhotoIndex = 0;
  }

  /**
   * Bascule l'affichage complet de la description
   */
  toggleFullDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  // ========== GESTION DES FAVORIS ==========

  loadUserFavorites(): void {
    if (!this.isLoggedIn()) {
      this.favoritesLoading = false;
      return;
    }

    this.favorisService.getFavoris().subscribe({
      next: (favoris) => {
        this.favorisIds = favoris.map(f => f.article.id);
        setTimeout(() => this.loadFavoritesCount(), 500);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des favoris :', err);
        this.favoritesLoading = false;
      }
    });

    this.loadFavoriteStatus();
  }

  loadFavoriteStatus(): void {
    this.favoritesLoading = true;
    
    // Attendre que les articles soient chargés
    setTimeout(() => {
      if (this.allArticles.length === 0) {
        this.favoritesLoading = false;
        return;
      }

      const statusChecks = this.allArticles.map(article => 
        this.favorisService.isFavori(article.id).pipe(
          map(isFav => ({ articleId: article.id, isFavorite: isFav })),
          catchError(() => of({ articleId: article.id, isFavorite: false }))
        )
      );
      
      forkJoin(statusChecks).subscribe({
        next: (results) => {
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
    }, 1000);
  }

  loadFavoritesCount(): void {
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

  isFavorite(articleId: number): boolean {
    if (this.favoritesStatus[articleId] !== undefined) {
      return this.favoritesStatus[articleId];
    }
    return this.favorisIds.includes(articleId);
  }

  toggleFavoris(article: Article): void {
    if (!this.isLoggedIn()) {
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
      event.stopPropagation();
    }
    this.toggleFavoris(article);
  }

  // ========== PAGINATION ==========

  prepareArticleGroups(): void {
    this.articleGroups = [];
    
    for (let i = 0; i < this.allArticles.length; i += this.articlesPerPage) {
      this.articleGroups.push(this.allArticles.slice(i, i + this.articlesPerPage));
    }
    
    if (this.articleGroups.length === 0) {
      this.articleGroups = [[]];
    }
  }

  nextPage(): void {
    if (this.currentPage < this.articleGroups.length - 1) {
      this.animateOut = true;
      this.animateIn = false;
      
      setTimeout(() => {
        this.currentPage++;
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
        this.scrollToArticles();
        
        setTimeout(() => {
          this.animateOut = false;
          this.animateIn = true;
        }, 50);
      }, 300);
    }
  }

  goToPage(pageIndex: number): void {
    if (pageIndex !== this.currentPage && pageIndex >= 0 && pageIndex < this.articleGroups.length) {
      this.animateOut = true;
      this.animateIn = false;
      
      setTimeout(() => {
        this.currentPage = pageIndex;
        this.scrollToArticles();
        
        setTimeout(() => {
          this.animateOut = false;
          this.animateIn = true;
        }, 50);
      }, 300);
    }
  }

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

  // ========== CHARGEMENT DES ARTICLES ==========
  
  loadCategoryByName(categoryName: string): void {
    const id = this.getCategoryId(categoryName);
  
    if (id === 0) {
      console.error('Catégorie inconnue:', categoryName);
      return;
    }
  
    this.categoryService.getById(id).subscribe({
      next: (category) => {
        console.log('Catégorie récupérée:', category);
        this.category = category;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de la catégorie:', error);
      }
    });
  }
  
  loadArticlesFromParams(category?: string, genre?: string): void {
    this.isLoading = true;
    
    if (category && genre) {
      const categoryId = this.getCategoryId(category);
      this.loadCategoryByName(category);
      
      this.articleService.filterArticles(categoryId, this.formatGenre(genre)).subscribe({
        next: (articles) => {
          this.allArticles = articles.filter(article => article.statut === 'ACCEPTE');
          this.prepareArticleGroups();
          this.categoryName = category;
          this.genre = this.formatGenre(genre);
          this.filterType = 'categoryAndGenre';
          this.isLoading = false;
          this.loadFavoriteStatus();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles filtrés:', err);
          this.isLoading = false;
        }
      });
    } else if (category) {
      const categoryId = this.getCategoryId(category);
      this.loadCategoryByName(category);
      
      this.articleService.getArticlesByCategory(categoryId).subscribe({
        next: (articles) => {
          this.allArticles = articles.filter(article => article.statut === 'ACCEPTE');
          this.prepareArticleGroups();
          this.categoryName = category;
          this.genre = '';
          this.filterType = 'category';
          this.isLoading = false;
          this.loadFavoriteStatus();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles par catégorie:', err);
          this.isLoading = false;
        }
      });
    } else if (genre) {
      this.articleService.getArticlesByGenre(this.formatGenre(genre)).subscribe({
        next: (articles) => {
          this.allArticles = articles.filter(article => article.statut === 'ACCEPTE');
          this.prepareArticleGroups();
          this.categoryName = '';
          this.genre = this.formatGenre(genre);
          this.filterType = 'genre';
          this.isLoading = false;
          this.loadFavoriteStatus();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles par genre:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.articleService.getArticlesByStatut('ACCEPTE').subscribe({
        next: (articles) => {
          this.allArticles = articles;
          this.prepareArticleGroups();
          this.categoryName = '';
          this.genre = '';
          this.filterType = '';
          this.isLoading = false;
          this.loadFavoriteStatus();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles acceptés:', err);
          this.isLoading = false;
        }
      });
    }
  }
  
  formatGenre(genre: string): string {
    if (!genre) return '';
    return genre.toUpperCase();
  }
  
  getCategoryId(categoryName: string): number {
    const categoryMap: {[key: string]: number} = {
      'chaussures': 1,
      'botte': 2,
      'mocassins': 3
    };
    
    return categoryMap[categoryName.toLowerCase()] || 0;
  }

  // ========== GESTION DU PANIER ==========

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

  getUniqueColors(stocks: any[]): Couleur[] {
    if (!stocks || stocks.length === 0) return [];
    const couleursUniques = [...new Set(stocks.map(stock => stock.couleur.id))];
    return couleursUniques.map(id => stocks.find(stock => stock.couleur.id === id)?.couleur);
  }

  selectCouleur(couleur: Couleur) {
    this.selectedCouleur = couleur;
    this.stockInsuffisant = false;
    this.selectedPointure = null;
    this.pointureOutOfStock = {};
    
    console.log("Couleur sélectionnée:", couleur.nom);
  
    if (this.selectedArticle && this.selectedArticle.stocks?.length) {
      this.selectedPointures = this.selectedArticle.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      console.log("Pointures disponibles:", this.selectedPointures);
      this.checkStockForAllSizes();
    } else {
      this.selectedPointures = [];
      console.log("Aucune pointure disponible pour cette couleur!");
    }
  }

  checkStockForAllSizes(): void {
    if (!this.selectedArticle || !this.selectedCouleur || this.selectedPointures.length === 0) {
      return;
    }
    
    const stockRequests = this.selectedPointures.map(pointure => 
      this.stockService.getStockQuantity(
        this.selectedArticle!.id,
        this.selectedCouleur!.id,
        pointure.id
      ).pipe(
        catchError(err => {
          console.error(`Erreur lors de la vérification du stock pour la pointure ${pointure.taille}:`, err);
          return of(0);
        })
      )
    );
    
    forkJoin(stockRequests).subscribe(results => {
      this.selectedPointures.forEach((pointure, index) => {
        const stockQuantity = results[index];
        this.pointureOutOfStock[pointure.id] = stockQuantity <= 0;
      });
      
      console.log("Statut du stock des pointures:", this.pointureOutOfStock);
    });
  }

  selectPointure(pointure: Pointure) {
    if (this.pointureOutOfStock[pointure.id]) {
      return;
    }
    
    this.selectedPointure = pointure;
    this.stockInsuffisant = false;
    
    if (this.selectedArticle && this.selectedCouleur) {
      this.stockService.getStockQuantity(
        this.selectedArticle.id,
        this.selectedCouleur.id,
        pointure.id
      ).subscribe({
        next: (quantite) => {
          this.stockDisponible = quantite;
          console.log(`Stock disponible: ${quantite} unités`);
          
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

    if (this.stockInsuffisant || this.pointureOutOfStock[this.selectedPointure.id]) {
      alert("Stock insuffisant pour cet article dans la couleur et pointure sélectionnées!");
      return;
    }
  
    this.panierService.ajouterAuPanier(this.selectedArticle, this.selectedCouleur, this.selectedPointure);
    alert(`${this.selectedArticle.name} ajouté au panier!`);
    
    this.selectedArticle = null;
  }

  // ========== UTILITAIRES ==========
  
  voirDetailsArticle(article: Article): void {
    localStorage.setItem('previousUrl', this.router.url);
    this.router.navigate(['/detailArticle', article.id]);
  }

  isLoggedIn(): boolean {
    const user = this.tokenStorage.getUser();
    return !!user && !!user.id;
  }

  isNewArticle(article: any): boolean {
    if (!article.createdAt) return false;
    const creationDate = new Date(article.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - creationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  onSlide(event: any, articleId: number): void {
    this.activeIndexes[articleId] = event.to;
  }

  getNomCouleur(couleurCode: string): string {
    const mapCouleurs: { [key: string]: string } = {
      '#3c2313': 'marron',
      '#ffffff': 'blanc',
      '#000000': 'noir',
    };
    return mapCouleurs[couleurCode] || couleurCode;
  }

  get Math() { 
    return Math; 
  }
}