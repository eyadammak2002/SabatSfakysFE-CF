// Méthodes à ajouter à votre composant ListFournisseurComponent

import { Component, OnInit } from '@angular/core';
import { Fournisseur } from 'src/app/pack/Fournisseur';
import { Article } from 'src/app/article/article';
import { ArticlePersonaliserService } from '../article-personaliser.service';
import { ArticleService } from 'src/app/article/article.service';
import { Router } from '@angular/router'; // Importez Router pour la navigation

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

  constructor(
    private articlePersonaliserService: ArticlePersonaliserService,
    private articleService: ArticleService,
    private router: Router // Injectez Router
  ) {}

  ngOnInit(): void {
    this.getFournisseurs();
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
      this.articleService.getArticlesByFournisseur(this.selectedFournisseur.email).subscribe({
        next: (articles) => {
          this.articlesDuFournisseur = articles;
          console.log("Articles du fournisseur :", this.articlesDuFournisseur);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des articles:', err);
        }
      });
    }
  }

  // Méthode pour obtenir les couleurs uniques à partir des stocks
  getUniqueColors(stocks: any[]): any[] {
    if (!stocks || !Array.isArray(stocks)) return [];
    
    // Créer un Map pour stocker les couleurs uniques par id
    const uniqueColorsMap = new Map();
    
    // Parcourir tous les stocks
    stocks.forEach(stock => {
      if (stock.couleur && !uniqueColorsMap.has(stock.couleur.id)) {
        uniqueColorsMap.set(stock.couleur.id, stock);
      }
    });
    
    // Convertir la Map en array
    return Array.from(uniqueColorsMap.values());
  }

  // Méthode pour calculer le stock total d'un article
  calculateTotalStock(stocks: any[]): number {
    if (!stocks || !Array.isArray(stocks)) return 0;
    
    return stocks.reduce((total, stock) => {
      return total + (stock.quantite || 0);
    }, 0);
  }

  // Méthode pour naviguer vers les détails d'un article
  viewArticleDetails(article: Article): void {
    if (article && article.id) {
      this.router.navigate(['/detailArticle', article.id]);
    }
  }
}