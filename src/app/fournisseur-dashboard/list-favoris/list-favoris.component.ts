import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Article, Stock } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-list-favoris',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './list-favoris.component.html',
  styleUrls: ['./list-favoris.component.css']
})
export class ListFavorisComponent {
articles: Article[] = [];
favorisCountMap: Map<number, number> = new Map(); // Map pour stocker le nombre de favoris par article
feedback: any = {};
isLoading = true;

constructor(
  private articleService: ArticleService,
  private favorisService: FavorisService,
  private tokenStorage: TokenStorageService,
  private router: Router
) {}

ngOnInit(): void {
  const user = this.tokenStorage.getUser();
  const email = user.email;

  // Récupérer les articles du fournisseur connecté
  this.articleService.getArticlesByFournisseur(email).subscribe({
    next: (data: Article[]) => {
      this.articles = data;
      console.log("✅ Articles récupérés :", this.articles);
      
      // Pour chaque article, récupérer le nombre de favoris
      this.fetchFavorisCountForArticles();
    },
    error: (err) => {
      console.error("Erreur lors de la récupération des articles :", err);
      this.isLoading = false;
      this.feedback = { type: 'danger', message: 'Erreur lors du chargement des articles.' };
    }
  });

  
}

fetchFavorisCountForArticles(): void {
  this.isLoading = true;

  Promise.all(
    this.articles.map(article =>
      this.favorisService.getArticleFavorisCount(article.id).toPromise()
    )
  )
  .then(counts => {
    counts.forEach((count, index) => {
      this.favorisCountMap.set(this.articles[index].id, count || 0);
    });
    this.isLoading = false;
  })
  .catch(error => {
    console.error('Erreur lors de la récupération des compteurs de favoris :', error);
    this.isLoading = false;
    this.feedback = {
      type: 'warning',
      message: 'Erreur lors du chargement des compteurs de favoris.'
    };
  });
}


getFavorisCount(articleId: number): number {
  return this.favorisCountMap.get(articleId) || 0;
}

getTotalStockForArticle(article: { stocks: Stock[] }): number {
  if (!article.stocks || article.stocks.length === 0) {
    return 0;
  }
  return article.stocks.reduce((sum: number, stock: Stock) => sum + (stock.quantite || 0), 0);
}

formatList(items: string[]): string {
  return items && items.length > 0 ? items.join(', ') : 'Aucune';
}

getTotalFavoris(): number {
  // Retourne le nombre total de favoris tous articles confondus
  return this.articles.reduce((sum, article) => sum + this.getFavorisCount(article.id), 0);
}

getArticlesWithFavoris(): number {
  // Retourne le nombre d'articles ayant au moins un favoris
  return this.articles.filter(article => this.getFavorisCount(article.id) > 0).length;
}

getPopularityRate(articleId: number): number {
  // Exemple: calcul d'un taux de popularité (peut être adapté selon vos besoins)
  const maxFavoris = Math.max(...this.articles.map(a => this.getFavorisCount(a.id)));
  if (maxFavoris === 0) return 0;
  return Math.round((this.getFavorisCount(articleId) / maxFavoris) * 100);
}

getLastFavorisDate(articleId: number): Date | null {
  // Retourne la date du dernier ajout aux favoris (à implémenter selon votre modèle de données)
  // Exemple fictif
  return new Date();
}

voirDetailsArticle(article: Article): void {
  // Mettre à jour l'URL précédente avant la navigation
  localStorage.setItem('previousUrl', '/Listfavoris');
  
  // Naviguer vers la page détaillée
  this.router.navigate(['/detailArticle', article.id]);
}

}