import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';

const API_URL = 'http://localhost:8080/api/favoris';
const CLIENT_API_URL = 'http://localhost:8080/client'; // Ajoutez cette URL

@Injectable({
  providedIn: 'root'
})
export class FavorisService {
  
  constructor(
    private http: HttpClient,
    private tokenStorageService: TokenStorageService
  ) { }

  /**
   * Obtenir l'email de l'utilisateur connecté
   */
  private getUserEmail(): string {
    const user = this.tokenStorageService.getUser();
    return user?.email || user?.username; // Selon la structure de votre objet user
  }

  /**
   * Récupérer l'ID du client à partir de son email
   */
  private getClientIdByEmail(): Observable<number | null> {
    const email = this.getUserEmail();
    if (!email) {
      return of(null);
    }
    return this.http.get<any>(`${CLIENT_API_URL}/email/${email}`)
      .pipe(
        switchMap(client => of(client.id)),
        catchError(error => {
          console.error('Erreur lors de la récupération du client par email:', error);
          return of(null);
        })
      );
  }

  /**
   * Récupérer tous les favoris de l'utilisateur connecté
   */
  getFavoris(): Observable<any[]> {
    return this.getClientIdByEmail().pipe(
      switchMap(clientId => {
        if (!clientId) {
          return of([]);
        }
        return this.http.get<any[]>(`${API_URL}/client/${clientId}`);
      })
    );
  }

  /**
   * Récupérer tous les articles favoris de l'utilisateur connecté
   */
  getArticlesFavoris(): Observable<any[]> {
    return this.getClientIdByEmail().pipe(
      switchMap(clientId => {
        if (!clientId) {
          return of([]);
        }
        return this.http.get<any[]>(`${API_URL}/client/${clientId}/articles`);
      })
    );
  }

  /**
   * Ajouter un article aux favoris
   */
  addToFavoris(articleId: number): Observable<any> {
    return this.getClientIdByEmail().pipe(
      switchMap(clientId => {
        if (!clientId) {
          return of({ error: 'Client non trouvé' });
        }
        return this.http.post(`${API_URL}/client/${clientId}/article/${articleId}`, {});
      })
    );
  }

  /**
   * Supprimer un article des favoris
   */
  removeFromFavoris(articleId: number): Observable<any> {
    return this.getClientIdByEmail().pipe(
      switchMap(clientId => {
        if (!clientId) {
          return of({ error: 'Client non trouvé' });
        }
        return this.http.delete(`${API_URL}/client/${clientId}/article/${articleId}`);
      })
    );
  }

  /**
   * Vérifier si un article est dans les favoris
   */
  isFavori(articleId: number): Observable<boolean> {
    return this.getClientIdByEmail().pipe(
      switchMap(clientId => {
        if (!clientId) {
          return of(false);
        }
        return this.http.get<boolean>(`${API_URL}/client/${clientId}/article/${articleId}/check`);
      })
    );
  }

  /**
   * Basculer l'état favori d'un article (ajouter/supprimer)
   */
  toggleFavori(articleId: number): Observable<any> {
    return this.isFavori(articleId).pipe(
      switchMap(isFavori => {
        if (isFavori) {
          return this.removeFromFavoris(articleId);
        } else {
          return this.addToFavoris(articleId);
        }
      })
    );
  }

  /**
   * Obtenir le nombre de fois qu'un article a été mis en favori
   */
  getArticleFavorisCount(articleId: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/article/${articleId}/count`);
  }
}