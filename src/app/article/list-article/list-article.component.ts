import { Component, OnInit } from '@angular/core';
import { PanierService } from 'src/app/services/panier.service';
import { Article } from '../article';
import { ArticleService } from '../article.service';

@Component({
  selector: 'app-list-article',
  templateUrl: './list-article.component.html',
  styleUrls: ['./list-article.component.css']
})
export class ListArticleComponent implements OnInit {
  allArticles: Article[] = []; // Liste des articles
  selectedArticle: Article | null = null;
  selectedCouleur: string = '';
  selectedPointure: string = '';
  
  constructor(
    private articleService: ArticleService,
    private panierService: PanierService // ✅ Service pour ajouter au panier
  ) {}

  ngOnInit(): void {
    this.fetchArticles();
  }

  selectCouleur(couleur: string) {
    this.selectedCouleur = couleur;
  }

  ouvrirModal(article: Article): void {
    this.selectedArticle = article;
    this.selectedCouleur = '';
    this.selectedPointure = '';
  }
  
  // ✅ Charger les articles depuis l'API
  fetchArticles(): void {
    this.articleService.get().subscribe({
      next: (data) => {
        this.allArticles = data;
        console.log("📦 Articles récupérés :", this.allArticles);
      },
      error: (err) => console.error("❌ Erreur lors du chargement des articles :", err)
    });
  }

  confirmerAjoutAuPanier(): void {
    if (!this.selectedArticle || !this.selectedCouleur || !this.selectedPointure) {
      alert("Veuillez sélectionner une couleur et une pointure !");
      return;
    }
    
    this.panierService.ajouterAuPanier(this.selectedArticle, this.selectedCouleur, this.selectedPointure);
    alert(`${this.selectedArticle.name} ajouté au panier !`);
    
    this.selectedArticle = null; // Fermer le modal
  }
  

  
 
}