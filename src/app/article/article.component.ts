import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ArticleService } from './article.service';
import { Article } from './article';

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
export class ArticleComponent {
  allArticle: Article[] = [];
  feedback: any = {};

  constructor(private articleService: ArticleService, private router: Router) {}

  ngOnInit(): void {
    this.getAllArticle();
  }

  getAllArticle() {
    this.articleService.get().subscribe((data: Article[]) => {
      this.allArticle = data;
      console.log("✅ Articles récupérés:", this.allArticle);
    });
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
}