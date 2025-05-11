import { Component, OnInit } from '@angular/core';
import { FavorisService } from '../services/favoris.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Article } from '../article/article';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './favoris.component.html',
  styleUrls: ['./favoris.component.css']
})
export class FavorisComponent implements OnInit {
  favoris: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private favorisService: FavorisService,    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadFavoris();
  }

  loadFavoris(): void {
    this.isLoading = true;
    this.favorisService.getArticlesFavoris().subscribe(
      data => {
        this.favoris = data;
        this.isLoading = false;
      },
      error => {
        this.errorMessage = 'Erreur lors du chargement des favoris';
        console.error('Erreur:', error);
        this.isLoading = false;
      }
    );
  }

  removeFromFavoris(articleId: number): void {
    this.favorisService.removeFromFavoris(articleId).subscribe(
      () => {
        // Filtrer l'article supprimé de la liste
        this.favoris = this.favoris.filter(article => article.id !== articleId);
      },
      error => {
        this.errorMessage = 'Erreur lors de la suppression du favori';
        console.error('Erreur:', error);
      }
    );
  }


  voirDetailsArticle(article: Article): void {
    this.router.navigate(['/detailArticle', article.id]);
  }
}
