import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/category/category.service';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';
import { StockService } from 'src/app/panier/stock.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-filtred-articles',
  templateUrl: './filtred-articles.component.html',
  styleUrls: ['./filtred-articles.component.css']
})
export class FiltredArticlesComponent implements OnInit {
  articles: Article[] = [];
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private panierService: PanierService,
    private stockService: StockService
  ) { }

  ngOnInit(): void {
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
        this.articles = JSON.parse(storedArticles);
        
        // Si nous avons une catégorie, charger ses détails
        if (this.categoryName) {
          this.loadCategoryByName(this.categoryName);
        }
      } else {
        // Sinon, charger les articles en fonction des paramètres d'URL
        this.loadArticlesFromParams(categoryParam, genreParam);
      }
    });
  }
  
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
      // Filtrer par catégorie et genre
      const categoryId = this.getCategoryId(category);
      this.loadCategoryByName(category);
      
      this.articleService.filterArticles(categoryId, this.formatGenre(genre)).subscribe({
        next: (articles) => {
          // Filtrer les articles pour ne garder que ceux avec statut ACCEPTE
          this.articles = articles.filter(article => article.statut === 'ACCEPTE');
          this.categoryName = category;
          this.genre = this.formatGenre(genre);
          this.filterType = 'categoryAndGenre';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles filtrés:', err);
          this.isLoading = false;
        }
      });
    } else if (category) {
      // Filtrer par catégorie uniquement
      const categoryId = this.getCategoryId(category);
      this.loadCategoryByName(category);
      
      this.articleService.getArticlesByCategory(categoryId).subscribe({
        next: (articles) => {
          // Filtrer les articles pour ne garder que ceux avec statut ACCEPTE
          this.articles = articles.filter(article => article.statut === 'ACCEPTE');
          this.categoryName = category;
          this.genre = '';
          this.filterType = 'category';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles par catégorie:', err);
          this.isLoading = false;
        }
      });
    } else if (genre) {
      // Filtrer par genre uniquement
      this.articleService.getArticlesByGenre(this.formatGenre(genre)).subscribe({
        next: (articles) => {
          // Filtrer les articles pour ne garder que ceux avec statut ACCEPTE
          this.articles = articles.filter(article => article.statut === 'ACCEPTE');
          this.categoryName = '';
          this.genre = this.formatGenre(genre);
          this.filterType = 'genre';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles par genre:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Aucun filtre, charger tous les articles acceptés
      this.articleService.getArticlesByStatut('ACCEPTE').subscribe({
        next: (articles) => {
          this.articles = articles;
          this.categoryName = '';
          this.genre = '';
          this.filterType = '';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des articles acceptés:', err);
          this.isLoading = false;
        }
      });
    }
  }
  
  // Formater le genre pour correspondre au format attendu par l'API
  formatGenre(genre: string): string {
    if (!genre) return '';
    return genre.toUpperCase();
  }
  
  // Convertir un nom de catégorie en ID
  getCategoryId(categoryName: string): number {
    const categoryMap: {[key: string]: number} = {
      'chaussures': 1,
      'botte': 2,
      'mocassins': 3
    };
    
    return categoryMap[categoryName.toLowerCase()] || 0;
  }

  // Méthodes pour le panier (copié de ListArticleComponent)
  ouvrirModal(article: Article): void {
    this.selectedArticle = article;
    this.selectedCouleur = null;
    this.selectedPointures = [];
    this.selectedPointure = null;
    this.stockDisponible = null;
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
  
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
    this.router.navigate(['/article-details', article.id]);
  }
}