import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/category/category.service';
import { Article } from '../article';
import { ArticleService } from '../article.service';

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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private categoryService: CategoryService
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
    return genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
  }
  
  // Convertir un nom de catégorie en ID
  getCategoryId(categoryName: string): number {
    const categoryMap: {[key: string]: number} = {
      'chaussures': 1,
      'sacs': 2,
      'autre': 3
      // Ajoutez d'autres catégories selon votre base de données
    };
    
    return categoryMap[categoryName.toLowerCase()] || 0;
  }


  
}