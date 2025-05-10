import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ArticleService } from './article.service';
import { Article, Stock } from './article';
import { TokenStorageService } from '../services/token-storage.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent implements OnInit {
  allArticle: Article[] = [];
  feedback: any = {};
  email:any="";
  constructor(
    private articleService: ArticleService, 
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.tokenStorage.getUser();
    const email = user.email;
  
    this.loadArticles(email);

  }

  delete(article: Article): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articleService.delete(article.id).subscribe({
        next: () => {
          this.allArticle = this.allArticle.filter(a => a.id !== article.id);
          this.feedback = { type: 'success', message: 'Article supprimé avec succès !' };
          setTimeout(() => { this.feedback = null; }, 3000);
        },
        error: (err) => {
          this.feedback = { type: 'warning', message: 'Erreur lors de la suppression.' };
          console.error('Erreur lors de la suppression de l\'article:', err);
        }
      });
    }
  }

  navigateToEditArticle(articleId: number): void {
    this.router.navigate(['/editArticle', articleId]);
  }

  redirectToCreateArticle() {
    this.router.navigate(['createArticle']);
  }

  // ✅ Fonction pour formater la liste des couleurs et des pointures
  formatList(items: string[]): string {
    return items && items.length > 0 ? items.join(', ') : 'Aucune';
  }

  // Calculer le stock total de tous les articles
  getTotalStock(): number {
    if (!this.allArticle || this.allArticle.length === 0) {
      return 0;
    }

    let totalStock = 0;
    this.allArticle.forEach(article => {
      if (article.stocks && article.stocks.length > 0) {
        article.stocks.forEach(stock => {
          totalStock += stock.quantite || 0;
        });
      }
    });
    return totalStock;
  }

  getAcceptedCount(): number {
    if (!this.allArticle || this.allArticle.length === 0) {
      return 0;
    }
    
    return this.allArticle.filter(article => article.statut === 'ACCEPTE').length;
  }

  // Calculer le prix moyen de vente
  getAveragePrice(): number {
    if (!this.allArticle || this.allArticle.length === 0) {
      return 0;
    }
    
    const total = this.allArticle.reduce((sum, article) => sum + (article.prixVente || 0), 0);
    return total / this.allArticle.length;
  }

  getTotalStockForArticle(article: { stocks: Stock[] }): number {
    if (!article.stocks || article.stocks.length === 0) {
      return 0;
    }

    return article.stocks.reduce((sum: number, stock: Stock) => sum + (stock.quantite || 0), 0);
  }

  loadArticles(email: string): void {
    this.articleService.getArticlesByFournisseur(email).subscribe({
      next: (data: Article[]) => {
        this.allArticle = data;
        console.log("✅ Articles récupérés :", this.allArticle);
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des articles :", err);
      }
    });
  }
}