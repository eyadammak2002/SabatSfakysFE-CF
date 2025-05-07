import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ArticlePersonaliserService, ArticlePersonaliser } from '../article-personaliser.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-fournisseur-articles-personalises',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './fournisseur-articles-personalises.component.html',
  styleUrls: ['./fournisseur-articles-personalises.component.css']
})
export class FournisseurArticlesPersonalisesComponent implements OnInit {
  articles: ArticlePersonaliser[] = [];
  filteredArticles: ArticlePersonaliser[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  fournisseurId: number = 0;
  statusFilter: string = 'all';
  unreadMessageCounts: { [articleId: number]: number } = {};

  constructor(
    private articleService: ArticlePersonaliserService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Utiliser getCurrentFournisseurId au lieu de récupérer directement user.id
    this.articleService.getCurrentFournisseurId().then(frId => {
      if (frId) {
        this.fournisseurId = frId;
        this.loadArticles();
      } else {
        this.isLoading = false;
        this.errorMessage = "Vous devez être connecté en tant que fournisseur pour accéder à cette page.";
      }
    }).catch(error => {
      console.error("Erreur lors de la récupération de l'ID fournisseur:", error);
      this.isLoading = false;
      this.errorMessage = "Erreur lors de la connexion. Veuillez réessayer.";
    });
  }
  
  // Charger les articles du fournisseur
  loadArticles(): void {
    this.isLoading = true;
    this.articleService.getArticlePersonalisersByFournisseur(this.fournisseurId).subscribe({
      next: (data) => {
        this.articles = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles:", err);
        this.errorMessage = "Impossible de charger les articles.";
        this.isLoading = false;
      }
    });
  }
  
  // Appliquer un filtre par statut
  applyFilter(): void {
    if (this.statusFilter === 'all') {
      this.filteredArticles = [...this.articles];
    } else {
      this.filteredArticles = this.articles.filter(article => article.statut === this.statusFilter);
    }
  }
  
  // Voir les détails d'un article avec chat
  viewArticleDetails(articleId: number | undefined): void {
    if (articleId) {
      // Vérifier d'abord si le chat est disponible pour cet article
      this.checkChatAvailability(articleId);
    }
  }

  // Vérifier si le chat est disponible avant de naviguer
  checkChatAvailability(articleId: number): void {
    const article = this.articles.find(a => a.id === articleId);
    
    // Si l'article n'est pas accepté, ajouter une note d'information
    if (article && article.statut !== 'ACCEPTE' && article.statut !== 'TERMINE') {
      const message = `Note: Le chat avec le client ne sera disponible qu'après avoir accepté cette demande d'article.`;
      alert(message);
    }
    
    // Naviguer vers les détails de l'article dans tous les cas
    this.router.navigate(['/article-personaliser', articleId]);
  }

  // Changer le statut d'un article
  changeArticleStatus(articleId: number | undefined, newStatus: string): void {
    if (!articleId) return;
    
    let message = '';
    
    // Si le statut est passé à ACCEPTE, expliquer l'activation du chat
    if (newStatus === 'ACCEPTE') {
      message = prompt('Ajouter un message pour le client (optionnel):\nNote: Cette action activera le chat avec le client.') || '';
    } else {
      message = prompt('Ajouter un message (optionnel):') || '';
    }
    
    this.articleService.changeArticleStatus(articleId, newStatus, message, this.fournisseurId).subscribe({
      next: () => {
        // Rechargement des articles après changement
        this.loadArticles();
        
        if (newStatus === 'ACCEPTE') {
          alert('Statut de l\'article modifié avec succès. Le chat avec le client est maintenant disponible.');
        } else {
          alert('Statut de l\'article modifié avec succès.');
        }
      },
      error: (err) => {
        console.error("Erreur lors du changement de statut:", err);
        alert("Erreur lors du changement de statut de l'article.");
      }
    });
  }

  // Formater le statut pour l'affichage
  getStatusClass(status: string): string {
    switch (status) {
      case 'EN_ATTENTE': return 'bg-warning';
      case 'ACCEPTE': return 'bg-success';
      case 'REFUSE': return 'bg-danger';
     
      default: return 'bg-secondary';
    }
  }

  // Méthodes pour les statistiques
  getEnAttente(): number {
    return this.articles.filter(article => article.statut === 'EN_ATTENTE').length;
  }

  getAcceptes(): number {
    return this.articles.filter(article => 
      article.statut === 'ACCEPTE' || article.statut === 'EN_PRODUCTION'
    ).length;
  }

  getTermines(): number {
    return this.articles.filter(article => article.statut === 'TERMINE').length;
  }
}