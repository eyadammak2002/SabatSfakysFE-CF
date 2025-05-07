import { Component, OnInit } from '@angular/core';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';
import { Router } from '@angular/router';
import { StockService } from 'src/app/panier/stock.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  constructor(
    private articleService: ArticleService,
    private panierService: PanierService,
    private router: Router,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.getArticlesWithStatut('ACCEPTE');
    // Chargement des favoris après chargement des articles
    this.loadFavoris();
  }

  // DÉBUT DES NOUVELLES FONCTIONS POUR LES FAVORIS ET RÉDUCTIONS
  
  // Charger les favoris depuis le localStorage
  loadFavoris(): void {
    setTimeout(() => {
      const favoris = localStorage.getItem('favoris');
      if (favoris) {
        const favorisIds = JSON.parse(favoris) as number[];
        this.allArticles.forEach(article => {
          // Ajouter la propriété isFavori si elle n'existe pas
          (article as any).isFavori = favorisIds.includes(article.id);
        });
      } else {
        // Initialiser tous les articles comme non-favoris
        this.allArticles.forEach(article => {
          (article as any).isFavori = false;
        });
      }
    }, 500); // Délai pour s'assurer que les articles sont chargés
  }
  
  // Fonction pour basculer le statut favori d'un article
  toggleFavori(article: Article): void {
    // Ajouter la propriété isFavori si elle n'existe pas
    if ((article as any).isFavori === undefined) {
      (article as any).isFavori = false;
    }
    
    // Inverser le statut
    (article as any).isFavori = !(article as any).isFavori;
    
    // Sauvegarder dans le localStorage
    const favorisIds = this.allArticles
      .filter(a => (a as any).isFavori)
      .map(a => a.id);
    
    localStorage.setItem('favoris', JSON.stringify(favorisIds));
    
    // Afficher un message (vous pouvez remplacer par une notification toast)
    if ((article as any).isFavori) {
      console.log(`${article.name} ajouté aux favoris`);
    } else {
      console.log(`${article.name} retiré des favoris`);
    }
  }
  
  // Calculer la réduction pour un article
  calculateReduction(article: Article): number | undefined {
    // Vérifier si l'article a un prix original (avant réduction)
    if ((article as any).prixOriginal && (article as any).prixOriginal > article.prixVente) {
      return Math.round(
        (((article as any).prixOriginal - article.prixVente) / (article as any).prixOriginal) * 100
      );
    }
    return undefined;
  }
  
  // Méthode pour obtenir la réduction d'un article (à utiliser dans le template)
  getReduction(article: Article): number | undefined {
    return (article as any).reduction || this.calculateReduction(article);
  }
  
  // Méthode pour vérifier si un article est en favori (à utiliser dans le template)
  isFavori(article: Article): boolean {
    return (article as any).isFavori === true;
  }
  
  // FIN DES NOUVELLES FONCTIONS

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
  
    console.log("Article sélectionné:", article);
    if (article.stocks && article.stocks.length > 0) {
      console.log("Stock de l'article:", article.stocks);
    } else {
      console.log("Aucune couleur ou pointure disponible pour cet article!");
    }
  }
  
  getArticlesWithStatut(statut: string): void {
    this.articleService.getArticlesByStatut(statut).subscribe({
      next: (data) => {
        this.allArticles = data;
        // Calculer les réductions pour tous les articles si nécessaire
        this.allArticles.forEach(article => {
          if ((article as any).prixOriginal && (article as any).prixOriginal > article.prixVente) {
            (article as any).reduction = this.calculateReduction(article);
          }
        });
        // Charger les favoris après avoir chargé les articles
        this.loadFavoris();
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
        // Calculer les réductions pour tous les articles si nécessaire
        this.allArticles.forEach(article => {
          if ((article as any).prixOriginal && (article as any).prixOriginal > article.prixVente) {
            (article as any).reduction = this.calculateReduction(article);
          }
        });
        // Charger les favoris après avoir chargé les articles
        this.loadFavoris();
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
  // Méthode pour ajouter la classe d'effet pressé
cardPress(element: HTMLElement): void {
  if (element) {
    element.classList.add('card-pressed');
  }
}

// Méthode pour retirer la classe d'effet pressé
cardRelease(element: HTMLElement): void {
  if (element) {
    element.classList.remove('card-pressed');
  }
}
}