import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ArticlePersonaliserService } from './article-personaliser.service';
import { ArticlePersonaliser } from './article-personaliser.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { Observable } from 'rxjs';
import { Couleur, Pointure } from '../article/article';

@Component({
  selector: 'app-articlePersonaliser',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './article-Personaliser.component.html',
  styleUrls: ['./article-Personaliser.component.css']
})
export class ArticlePersonaliserComponent implements OnInit {
  articlesPersonalises: ArticlePersonaliser[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  currentUserEmail: string | null = null;
  
  constructor(
    private articlePersonaliserService: ArticlePersonaliserService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Récupérer l'email de l'utilisateur connecté
    const user = this.tokenStorage.getUser();
    if (user && user.email) {
      this.currentUserEmail = user.email;
      this.loadArticlesPersonalises();
    } else {
      this.isLoading = false;
      this.errorMessage = "Vous devez être connecté pour accéder à vos articles personnalisés.";
    }
  }

  // Charger les articles personnalisés du client
  loadArticlesPersonalises(): void {
    if (!this.currentUserEmail) return;
    
    this.isLoading = true;
    this.articlePersonaliserService.getArticlesPersonalisesByEmail(this.currentUserEmail).subscribe({
      next: (data) => {
        this.articlesPersonalises = data;
        this.isLoading = false;
        console.log("Articles personnalisés chargés:", this.articlesPersonalises);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles personnalisés:", err);
        this.isLoading = false;
        this.errorMessage = "Erreur lors du chargement de vos articles personnalisés.";
      }
    });
  }

  supprimerArticlePersonalise(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article personnalisé ?')) {
      this.articlePersonaliserService.deleteArticlePersonaliser(id).subscribe({
        next: (responseMessage: string) => {
          // Mise à jour locale
          this.articlesPersonalises = this.articlesPersonalises.filter(article => article.id !== id);
          
          // Affiche le message renvoyé par le backend
          alert(responseMessage);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'article personnalisé:', err);
  
          const message = err?.error || '❌ Erreur inconnue lors de la suppression.';
          alert(message);
        }
      });
    }
  }
  
  

  // Modifier un article personnalisé
  modifierArticlePersonalise(id: number): void {
    this.router.navigate(['/article-personaliser/edit', id]);
  }

  // Créer un nouvel article personnalisé
  creerArticlePersonalise(): void {
    this.router.navigate(['/createArticlePersonaliser']);
  }

  // Formater la date pour l'affichage
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Obtenir le statut formaté avec icône
  getStatutFormate(statut: string): { texte: string, classe: string, icone: string } {
    switch (statut) {
      case 'EN_ATTENTE':
        return {
          texte: 'En attente',
          classe: 'badge bg-warning',
          icone: 'fas fa-clock'
        };
      case 'VALIDE':
        return {
          texte: 'Validé',
          classe: 'badge bg-success',
          icone: 'fas fa-check-circle'
        };
      case 'REJETE':
        return {
          texte: 'Rejeté',
          classe: 'badge bg-danger',
          icone: 'fas fa-times-circle'
        };
      case 'EN_PRODUCTION':
        return {
          texte: 'En production',
          classe: 'badge bg-info',
          icone: 'fas fa-cogs'
        };
      case 'LIVRE':
        return {
          texte: 'Livré',
          classe: 'badge bg-primary',
          icone: 'fas fa-truck'
        };
      default:
        return {
          texte: statut,
          classe: 'badge bg-secondary',
          icone: 'fas fa-question-circle'
        };
    }
  }

  
}