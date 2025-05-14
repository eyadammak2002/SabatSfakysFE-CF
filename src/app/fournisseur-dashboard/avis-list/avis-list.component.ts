import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Article } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
import { AvisService } from 'src/app/services/avis.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';


@Component({
  selector: 'app-avis-list',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './avis-list.component.html',
  styleUrls: ['./avis-list.component.css']
})
export class AvisListComponent implements OnInit {
  articles: Article[] = [];
  articlesAvis: { [articleId: number]: any[] } = {}; // Map pour stocker les avis par articleId
  feedback: any = {};
  isLoading = true;
  isLoadingAvis: { [articleId: number]: boolean } = {}; // Pour suivre le chargement des avis
  

  constructor(
    private articleService: ArticleService,
    private avisService: AvisService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private cdr: ChangeDetectorRef // Ajouter le ChangeDetectorRef

  ) {}
  
  ngOnInit(): void {
    // Récupérer l'email du fournisseur connecté
    const user = this.tokenStorage.getUser();
    const email = user.email;
    
    // Récupérer tous les articles de ce fournisseur
    this.articleService.getArticlesByFournisseur(email).subscribe({
      next: (data: Article[]) => {
        this.articles = data;
        console.log("✅ Articles récupérés pour la liste des avis:", this.articles);
        this.isLoading = false;
        
        // Initialiser le chargement des avis pour chaque article
        this.articles.forEach(article => {
          if (article.id) {
            this.loadArticleAvis(article.id);
          }
        });
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des articles pour les avis:", err);
        this.feedback = { type: 'warning', message: 'Erreur lors de la récupération des articles.' };
        this.isLoading = false;
      }
    });
  }
  


  loadArticleAvis(articleId: number): void {
    this.isLoadingAvis[articleId] = true;
    
    this.avisService.getAvisByArticleId(articleId).subscribe({
      next: (data) => {
        this.articlesAvis[articleId] = data;
        this.isLoadingAvis[articleId] = false;
        console.log(`💬 Avis chargés pour l'article #${articleId}:`, data);
        
        // Charger les informations utilisateur pour chaque avis
        if (this.articlesAvis[articleId] && this.articlesAvis[articleId].length > 0) {
          this.articlesAvis[articleId].forEach(avis => {
            if (!avis.user || !avis.user.username) {
              this.loadUserForAvis(avis.id, articleId);
            }
          });
        }
      },
      error: (err) => {
        console.error(`❌ Erreur lors du chargement des avis pour l'article #${articleId}:`, err);
        this.isLoadingAvis[articleId] = false;
      }
    });
  }
  
  // Nouvelle méthode pour charger les informations utilisateur pour un avis
  loadUserForAvis(avisId: number, articleId: number): void {
    this.avisService.getUserFromAvis(avisId).subscribe({
      next: (clientData) => {
        console.log("clientData", clientData);
        // Trouver l'avis dans le tableau correspondant à l'article
        const avisIndex = this.articlesAvis[articleId].findIndex(a => a.id === avisId);
        if (avisIndex !== -1) {
          // Assigner directement les données client à l'avis
          this.articlesAvis[articleId][avisIndex].client = clientData;
          console.log(`Informations client mises à jour pour l'avis ${avisId}:`, this.articlesAvis[articleId][avisIndex].client);
          this.cdr.detectChanges(); // Forcer la mise à jour de l'affichage
        }
      },
      error: (err) => {
        console.error(`Erreur lors du chargement des informations client pour l'avis ${avisId}:`, err);
      }
    });
  }
  // Méthode pour récupérer les avis d'un article
  getAvis(articleId: number): any[] {
    return this.articlesAvis[articleId] || [];
  }
  
  // Méthode pour vérifier si les avis sont en cours de chargement
  isArticleAvisLoading(articleId: number): boolean {
    return this.isLoadingAvis[articleId] === true;
  }
  
  // Méthode pour rediriger vers la page détail de l'article avec les avis
  voirAvis(articleId: number): void {
    localStorage.setItem('previousUrl', this.router.url);

    this.router.navigate(['/detailArticleFR', articleId]);

  }
  
  // Méthode pour obtenir le nombre d'avis pour un article
  getNombreAvis(article: Article): number {
    if (!article.id || !this.articlesAvis[article.id]) {
      return 0;
    }
    return this.articlesAvis[article.id].length;
  }
  
  // Méthode pour obtenir la note moyenne des avis pour un article
  getNoteMoyenne(article: Article): number {
    if (!article.id || !this.articlesAvis[article.id] || this.articlesAvis[article.id].length === 0) {
      return 0;
    }
    
    const avis = this.articlesAvis[article.id];
    const sommeNotes = avis.reduce((sum, avisItem) => sum + (avisItem.note || 0), 0);
    return Math.round((sommeNotes / avis.length) * 10) / 10;
  }
  
  // Méthode pour calculer le nombre total d'avis
  getTotalAvis(): number {
    let total = 0;
    for (const article of this.articles) {
      if (article.id) {
        total += this.getNombreAvis(article);
      }
    }
    return total;
  }
  
  // Méthode pour calculer la note moyenne globale
  getNoteMoyenneGlobale(): string {
    const articlesAvecAvis = this.articles.filter(article => article.id && this.getNombreAvis(article) > 0);
    
    if (articlesAvecAvis.length === 0) {
      return '0.0';
    }
    
    let totalNotes = 0;
    
    for (const article of articlesAvecAvis) {
      totalNotes += this.getNoteMoyenne(article);
    }
    
    return (totalNotes / articlesAvecAvis.length).toFixed(1);
  }
}