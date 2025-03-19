import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Article } from './article';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = 'http://127.0.0.1:8080/article';  // L'URL de ton back-end

  constructor(private http: HttpClient) {}

  // Récupérer tous les articles
  get(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
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
        console.error('Erreur détaillée lors de la mise à jour de l\'article:', error);
        return throwError(() => new Error('Erreur lors de la mise à jour de l\'article'));
      })
    );
  }

  // Supprimer un article
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
