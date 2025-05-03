import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ArticleService } from '../article/article.service';

@Injectable({
  providedIn: 'root'
})
export class SearchDataService {
  // BehaviorSubject pour les résultats de recherche
  private searchResultsSubject = new BehaviorSubject<any[]>([]);
  searchResults$ = this.searchResultsSubject.asObservable();
  
  // BehaviorSubject pour le message de réponse IA
  private aiResponseSubject = new BehaviorSubject<string>('');
  aiResponse$ = this.aiResponseSubject.asObservable();
  
  // BehaviorSubject pour indiquer si une recherche est active
  private searchActiveSubject = new BehaviorSubject<boolean>(false);
  searchActive$ = this.searchActiveSubject.asObservable();
  
  // BehaviorSubject pour indiquer si le chargement est en cours
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  constructor(private articleService: ArticleService) { }
  
  // Méthode pour mettre à jour les résultats avec chargement des détails complets
  // Cette méthode attend maintenant directement un tableau d'articles et un message
  updateSearchResults(articles: any[], aiMessage: string = '') {
    console.log('SearchDataService - Articles reçus:', articles);
    
    // Si aucun résultat ou tableau vide, simplement afficher le message
    if (!articles || articles.length === 0) {
      console.log('SearchDataService - Aucun article à afficher');
      this.searchResultsSubject.next([]);
      this.aiResponseSubject.next(aiMessage);
      this.searchActiveSubject.next(true);
      this.loadingSubject.next(false);
      return;
    }
    
    // Afficher les informations sur les articles reçus
    console.log('SearchDataService - Nombre d\'articles reçus:', articles.length);
    articles.forEach((article, index) => {
      console.log(`SearchDataService - Article ${index}:`, article);
    });
    
    // Indiquer que le chargement est en cours
    this.loadingSubject.next(true);
    
    // Extraire les IDs des articles trouvés
    const articleIds = articles.map(article => article.id).filter(id => id);
    console.log('SearchDataService - IDs des articles à charger:', articleIds);
    
    // Si aucun article n'a d'ID valide, utiliser directement les articles reçus
    if (articleIds.length === 0) {
      console.log('SearchDataService - Utilisation directe des articles reçus');
      this.searchResultsSubject.next(articles);
      this.aiResponseSubject.next(aiMessage);
      this.searchActiveSubject.next(true);
      this.loadingSubject.next(false);
      return;
    }
    
    // Créer un tableau de requêtes pour chaque article
    const articleRequests = articleIds.map(id => 
      this.articleService.getById(id).pipe(
        catchError(err => {
          console.error(`Erreur lors du chargement de l'article ${id}:`, err);
          // Chercher l'article partiel dans les résultats initiaux
          const partialArticle = articles.find(a => a.id === id);
          return of(partialArticle);
        })
      )
    );
    
    // Exécuter toutes les requêtes en parallèle
    forkJoin(articleRequests).subscribe({
      next: (completeArticles) => {
        console.log('SearchDataService - Articles complets chargés:', completeArticles);
        
        // Filtrer les articles null ou undefined
        const validArticles = completeArticles.filter(article => article);
        
        if (validArticles.length === 0) {
          console.warn('SearchDataService - Aucun article valide après chargement');
          // Utiliser les articles originaux comme fallback
          this.searchResultsSubject.next(articles);
        } else {
          this.searchResultsSubject.next(validArticles);
        }
        
        this.aiResponseSubject.next(aiMessage);
        this.searchActiveSubject.next(true);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('SearchDataService - Erreur lors du chargement des articles:', err);
        // En cas d'erreur, utiliser les articles originaux
        this.searchResultsSubject.next(articles);
        this.aiResponseSubject.next(aiMessage);
        this.searchActiveSubject.next(true);
        this.loadingSubject.next(false);
      }
    });
  }
  
  // Méthode pour réinitialiser les résultats
  clearSearchResults() {
    this.searchResultsSubject.next([]);
    this.aiResponseSubject.next('');
    this.searchActiveSubject.next(false);
    this.loadingSubject.next(false);
  }
}