import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Article, Couleur, Pointure } from './article';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = 'http://127.0.0.1:8080/article';  // L'URL de ton back-end
  private apiUrl1 = 'http://127.0.0.1:8080/article/statut/'; 
  constructor(private http: HttpClient) {}

  notifierArticle(message:string){
    return this.http.post('http://127.0.0.1:8080/api/notification/article',message);
  }
  // Récupérer tous les articles
  get(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  getArticlesByStatut(statut: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl1}${statut}`);
  }

  // Récupérer un article par son ID
  getById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  create(article: Article, emailFournisseur: string): Observable<number> {
    console.log('Article envoyé au backend:', article);

    return this.http.post<number>(`${this.apiUrl}/create?emailFournisseur=${emailFournisseur}`, article);
}


  // Mettre à jour un article avec l'email du fournisseur
  update(id: number, article: Article, emailFournisseur: string): Observable<Article> {
    console.log('Article envoyé au backend lors update :', article, 'Email Fournisseur:', emailFournisseur);

    return this.http.put<Article>(`${this.apiUrl}/${id}/update?emailFournisseur=${emailFournisseur}`, article, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour:', error.message, error);
        return throwError(() => new Error(error.message || 'Erreur inconnue'));
      })
      
    );
  }

  // Supprimer un article
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

    // Récupérer toutes les couleurs
    getCouleurs(): Observable<Couleur[]> {
      return this.http.get<Couleur[]>(`${this.apiUrl}/couleurs`);
    }
  
    // Récupérer toutes les pointures
    getPointures(): Observable<Pointure[]> {
      return this.http.get<Pointure[]>(`${this.apiUrl}/pointures`);
    }

  // Service Angular
 
  
}
