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
  displayedColumns = ['id', 'name','description', 'dateFond', 'fondateur' ,'photo','contact', 'actions'];
  selectedArticle!: Article;
  allArticle: Article[] = [];
  feedback: any = {};
  deleteModal: any;
  idTodelete: number = 0;

  constructor(private articleService: ArticleService
    ,private router:Router,
  ) {}
 
  ngOnInit(): void {
    this.getAllArticle();
  }
 
  getAllArticle() {
    this.articleService.get().subscribe((data:Article[]) => {
      this.allArticle= data;
      console.log("allEmployes : ", this.allArticle);
    });
  }
  openDeleteModal(id: number) {
    this.idTodelete = id;
    this.deleteModal.show();
  }
 
  select(selected: Article): void {
    this.selectedArticle = selected;
  }
  normalizeStatut(statut: string): string {
    return statut ? statut.toUpperCase().trim() : 'EN_ATTENTE';
  }
  
  delete(article: Article): void {
    // Afficher une confirmation avant de supprimer
    if (confirm('Êtes-vous sûr de vouloir supprimer ce article ?')) {
      // Appeler le service de suppression
      this.articleService.delete(article.id).subscribe({
        next: () => {
          // Filtrer la liste des articles pour exclure celui qui a été supprimé
          this.allArticle = this.allArticle.filter(p => p.id !== article.id);
          // Afficher un message de succès
          this.feedback = { type: 'success', message: 'La suppression a été effectuée avec succès !' };
          // Effacer le message de retour après 3 secondes
          setTimeout(() => {
            this.feedback = null;
          }, 3000);
        },
        error: (err) => {
          // Afficher un message d'erreur en cas de problème
          this.feedback = { type: 'warning', message: 'Erreur lors de la suppression.' };
          console.error('Erreur lors de la suppression du article:', err);
        }
      });
    }
  }
  


  getEditArticleUrl(id: number): string {
      return `/editArticle/${id}`;
  }

  redirectToCreateArticle() {
    this.router.navigate(['createArticle']);
  }

  redirectToArticle(): void {
    this.router.navigate(['article']); // Redirige vers la page de création d'article
  }
  navigateToEditArticle(articleId: number): void {
      this.router.navigate(['/editArticle', articleId]);
  }

    // Méthode pour encoder le nom du fichier
    encodePhotoName(name: string): string {
      return decodeURIComponent(name);
    }

}
