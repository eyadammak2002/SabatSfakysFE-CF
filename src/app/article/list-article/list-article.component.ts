import { Component, OnInit } from '@angular/core';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';
import { Router } from '@angular/router';
import { StockService } from 'src/app/panier/stock.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SearchDataService } from 'src/app/services/search-data.service';

@Component({
  selector: 'app-list-article',
  templateUrl: './list-article.component.html',
  styleUrls: ['./list-article.component.css']
})
export class ListArticleComponent implements OnInit {
  allArticles: Article[] = []; // Liste des articles
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null; 
  selectedPointure: Pointure | null = null; 
  selectedPointures: Pointure[] = []; 
  stockDisponible: number | null = null; 
  stockInsuffisant: boolean = false;
  
  // Nouvel objet pour suivre le statut du stock de chaque pointure
  pointureOutOfStock: { [id: number]: boolean } = {};
  searchResults: any[] = [];
  aiResponse: string = '';
  isSearchMode: boolean = false;
  isSearchLoading: boolean = false;
  activePhotoIndex: number | undefined;
  showFullDescription: boolean = false;


  constructor(
    private articleService: ArticleService,
    private panierService: PanierService,
    private router: Router,
    private stockService: StockService,
    private searchDataService: SearchDataService
  ) {}

  ngOnInit(): void {
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
    this.router.navigate(['/detailArticle', article.id]);
  }
}