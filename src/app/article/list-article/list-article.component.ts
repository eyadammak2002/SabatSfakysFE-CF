import { Component, OnInit } from '@angular/core';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { PanierService } from 'src/app/services/panier.service';

@Component({
  selector: 'app-list-article',
  templateUrl: './list-article.component.html',
  styleUrls: ['./list-article.component.css']
})
export class ListArticleComponent implements OnInit {
  allArticles: Article[] = []; // Liste des articles
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null; // Couleur is now a Couleur object, not a string
  selectedPointure: Pointure | null = null; // Pointure is now a Pointure object, not a string
  selectedPointures: Pointure[] = []; // ✅ Doit contenir des objets Pointure

  constructor(
    private articleService: ArticleService,
    private panierService: PanierService // ✅ Service pour ajouter au panier
  ) {}

  ngOnInit(): void {
    //this.fetchArticles();
    this.getArticlesWithStatut('ACCEPTE');
  }

  selectCouleur(couleur: Couleur) {
    this.selectedCouleur = couleur;
    console.log("🎨 Couleur sélectionnée :", couleur.nom);
  
    if (this.selectedArticle && this.selectedArticle.stocks?.length) {
      this.selectedPointures = this.selectedArticle.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure); // ✅ Stocke l'objet Pointure entier
    
      console.log("👟 Pointures disponibles :", this.selectedPointures);
      this.selectedPointure = null; // Réinitialiser la sélection
    } else {
      this.selectedPointures = [];
      console.log("⚠️ Aucune pointure disponible pour cette couleur !");
    }
  }
  

  getUniqueColors(stocks: any[]): Couleur[] { // Return Couleur objects, not strings
    const couleursUniques = [...new Set(stocks.map(stock => stock.couleur.id))]; // Assuming you use ID to find unique couleurs
    console.log("🎨 Couleurs uniques détectées :", couleursUniques);
    return couleursUniques.map(id => stocks.find(stock => stock.couleur.id === id)?.couleur); // Get the full Couleur object
  }
  
  ouvrirModal(article: Article): void {
    this.selectedArticle = article;
    this.selectedCouleur = null; // Reset selectedCouleur and other selections
    this.selectedPointures = [];
    this.selectedPointure = null;
  
    console.log("🛒 Article sélectionné :", article);
    if (article.stocks && article.stocks.length > 0) {
      console.log("📦 Stock de l'article :", article.stocks);
    } else {
      console.log("⚠️ Aucune couleur ou pointure disponible pour cet article !");
    }
  }
  
  // ✅ Charger les articles depuis l'API
  /*fetchArticles(): void {
    this.articleService.get().subscribe({
      next: (data) => {
        this.allArticles = data.map(article => ({
          ...article,
          stocks: article.stocks ?? [] // Assure que stocks est toujours un tableau
        }));
        console.log("📦 Articles récupérés :", this.allArticles);
      },
      error: (err) => console.error("❌ Erreur lors du chargement des articles :", err)
    });
  }*/

   // Fonction pour récupérer les articles avec statut "ACCEPTE"
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

  confirmerAjoutAuPanier(): void {
    if (!this.selectedArticle) {
      alert("Aucun article sélectionné !");
      return;
    }
  
    if (!this.selectedCouleur) {
      alert("Veuillez sélectionner une couleur !");
      return;
    }
  
    if (!this.selectedPointure) {
      alert("Veuillez sélectionner une pointure !");
      return;
    }
  
    this.panierService.ajouterAuPanier(this.selectedArticle, this.selectedCouleur, this.selectedPointure);
    alert(`${this.selectedArticle.name} ajouté au panier !`);
    
    this.selectedArticle = null; // Fermer le modal
  }
}
