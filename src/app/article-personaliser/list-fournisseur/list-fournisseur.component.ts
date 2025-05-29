import { Component, OnInit } from '@angular/core';
import { Fournisseur } from 'src/app/pack/Fournisseur';
import { Article, Couleur, Pointure } from 'src/app/article/article';
import { ArticlePersonaliserService } from '../article-personaliser.service';
import { ArticleService } from 'src/app/article/article.service';
import { Router } from '@angular/router';
import { FavorisService } from 'src/app/services/favoris.service';
import { PanierService } from 'src/app/services/panier.service';
import { StockService } from 'src/app/panier/stock.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-list-fournisseur',
  templateUrl: './list-fournisseur.component.html',
  styleUrls: ['./list-fournisseur.component.css']
})
export class ListFournisseurComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  selectedFournisseurId: number | null = null;
  selectedFournisseur: Fournisseur | null = null;
  articlesDuFournisseur: Article[] = [];
  
  // Propriétés pour le carousel
  activeIndexes: { [key: number]: number } = {};
  
  // Propriétés pour les favoris
  favorisIds: number[] = [];
  favoritesStatus: { [articleId: number]: boolean } = {};
  
  // Propriétés pour le panier
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  selectedPointures: Pointure[] = [];
  stockInsuffisant: boolean = false;
  pointureOutOfStock: { [id: number]: boolean } = {};
  activePhotoIndex: number = 0;
  selectedStockInfo: number | null = null;

  constructor(
    private articlePersonaliserService: ArticlePersonaliserService,
    private articleService: ArticleService,
    private router: Router,
    private favorisService: FavorisService,
    private panierService: PanierService,
    private stockService: StockService,
    private tokenStorage: TokenStorageService
  ) {}

  ngOnInit(): void {
    this.getFournisseurs();
    this.loadFavoris();
  }

  getFournisseurs(): void {
    this.articlePersonaliserService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        console.log('Fournisseurs récupérés:', this.fournisseurs);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des fournisseurs:', err);
      }
    });
  }

  onFournisseurSelect(event: Event): void {
    const selectedId = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedFournisseurId = selectedId;
    this.selectedFournisseur = this.fournisseurs.find(f => f.id === selectedId) || null;
    console.log('Fournisseur sélectionné:', this.selectedFournisseur);

    if (this.selectedFournisseur?.email) {
      this.articleService.getArticlesAccepterByFournisseur(this.selectedFournisseur.email).subscribe({
        next: (articles) => {
          this.articlesDuFournisseur = articles;
          
          // Initialiser les indices actifs pour chaque article
          this.articlesDuFournisseur.forEach(article => {
            if (article.id) {
              this.activeIndexes[article.id] = 0;
            }
          });
          
          console.log("Articles du fournisseur :", this.articlesDuFournisseur);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des articles:', err);
        }
      });
    } else {
      // Réinitialiser les articles si aucun fournisseur n'est sélectionné
      this.articlesDuFournisseur = [];
    }
  }

  // --- Méthodes pour le carousel ---
  onSlide(event: any, articleId: number): void {
    if (articleId) {
      this.activeIndexes[articleId] = event.to;
    }
  }

  // --- Méthodes pour obtenir les informations des articles ---
  getUniqueColors(stocks: any[]): any[] {
    if (!stocks || !Array.isArray(stocks)) return [];
    
    const uniqueColorsMap = new Map();
    stocks.forEach(stock => {
      if (stock.couleur && !uniqueColorsMap.has(stock.couleur.id)) {
        uniqueColorsMap.set(stock.couleur.id, stock.couleur);
      }
    });
    
    return Array.from(uniqueColorsMap.values());
  }

  calculateTotalStock(stocks: any[]): number {
    if (!stocks || !Array.isArray(stocks)) return 0;
    
    return stocks.reduce((total, stock) => {
      return total + (stock.quantite || 0);
    }, 0);
  }

  getNomCouleur(couleurCode: string): string {
    const mapCouleurs: { [key: string]: string } = {
      '#3c2313': 'marron',
      '#ffffff': 'blanc',
      '#000000': 'noir',
      // ajouter d'autres couleurs si nécessaire
    };
    return mapCouleurs[couleurCode] || couleurCode;
  }

  // --- Méthodes pour les favoris ---
  loadFavoris(): void {
    // Vérifier si l'utilisateur est connecté
    if (this.isLoggedIn()) {
      this.favorisService.getFavoris().subscribe({
        next: (favoris) => {
          this.favorisIds = favoris.map(f => f.article.id);
          console.log('Favoris chargés:', this.favorisIds);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des favoris:', err);
        }
      });
    }
  }

  isLoggedIn(): boolean {
    const user = this.tokenStorage.getUser();
    return !!user && !!user.id;
  }

  isFavorite(articleId: number): boolean {
    if (this.favoritesStatus[articleId] !== undefined) {
      return this.favoritesStatus[articleId];
    }
    return this.favorisIds.includes(articleId);
  }

  toggleFavoris(article: Article): void {
    if (!this.isLoggedIn()) {
      // Redirection vers la page de connexion
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

        // Mettre à jour le statut des favoris
        const isFav = !this.isFavorite(article.id);
        this.favoritesStatus[article.id] = isFav;
        
        const index = this.favorisIds.indexOf(article.id);
        if (index > -1 && !isFav) {
          this.favorisIds.splice(index, 1);
        } else if (index === -1 && isFav) {
          this.favorisIds.push(article.id);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour des favoris:', err);
      }
    });
  }

  // --- Méthodes pour les détails et le panier ---
  viewArticleDetails(article: Article): void {
    if (article && article.id) {
      localStorage.setItem('previousUrl', this.router.url);
      this.router.navigate(['/detailArticle', article.id]);
    }
  }

  addToCart(article: Article): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.selectedArticle = article;
    this.selectedCouleur = null;
    this.selectedPointure = null;
    this.selectedPointures = [];
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
    this.activePhotoIndex = 0;
    this.selectedStockInfo = null;
  }

  cancelAddToCart(): void {
    this.selectedArticle = null;
    this.selectedCouleur = null;
    this.selectedPointure = null;
    this.selectedPointures = [];
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
  }

  selectCouleur(couleur: Couleur): void {
    this.selectedCouleur = couleur;
    this.stockInsuffisant = false;
    this.selectedPointure = null;
    this.pointureOutOfStock = {};
    this.selectedStockInfo = null;
    
    if (this.selectedArticle && this.selectedArticle.stocks?.length) {
      // Filtrer les pointures disponibles pour cette couleur
      this.selectedPointures = this.selectedArticle.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      // Vérifier le stock pour chaque pointure
      this.checkStockForAllSizes();
    } else {
      this.selectedPointures = [];
    }
  }

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
          console.error(`Erreur lors de la vérification du stock:`, err);
          return of(0);
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
    });
  }

  selectPointure(pointure: Pointure): void {
    // Ne rien faire si la pointure est en rupture de stock
    if (this.pointureOutOfStock[pointure.id]) {
      return;
    }
    
    this.selectedPointure = pointure;
    this.stockInsuffisant = false;
    
    // Vérifier le stock disponible
    if (this.selectedArticle && this.selectedCouleur) {
      this.stockService.getStockQuantity(
        this.selectedArticle.id,
        this.selectedCouleur.id,
        pointure.id
      ).subscribe({
        next: (quantite) => {
          this.selectedStockInfo = quantite;
          
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
    
    this.selectedArticle = null;
  }

  goBack() {
    this.router.navigate(['/createArticlePersonaliser']);
  }
}