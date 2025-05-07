import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Photo } from '../photo/Photo';
import { Category } from '../category/category';
import { Couleur, Pointure } from '../article/article';
import { Client } from '../services/avis.service';

// Configuration de l'API directement dans le service
const API_CONFIG = {
  apiBaseUrl: 'http://localhost:8080/api' // À modifier selon votre environnement
  
};

// Interfaces pour les modèles
export interface ArticlePersonaliser {
  id?: number;
  ref: string;
  name: string;
  description: string;
  quantite?: number;
  genre?: string;
  tissu?: string;
  statut: string;
  categorie?: string; // Ajouté pour compatibilité avec le filtrage
  photos: Photo[];
  category: Category;
  dateAjout?: Date;
  client: Client;
  couleurs?: Couleur[];
  pointures?: Pointure[];
  nom?: string; // Ajouté pour compatibilité avec le composant (name/nom)
}

@Injectable({
  providedIn: 'root'
})
export class ArticlePersonaliserService {
  private apiUrl = 'http://127.0.0.1:8080/api/articlePersonaliser';  
  private apiUrl1 = 'http://127.0.0.1:8080/article';  // L'URL de ton back-end

  constructor(private http: HttpClient) { }


  get(): Observable<ArticlePersonaliser[]> {
    return this.getAllArticlePersonalisers();
  }

 
  getAllArticlePersonalisers(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(this.apiUrl);
  }


  getById(id: number): Observable<ArticlePersonaliser> {
    return this.getArticlePersonaliserById(id);
  }

  getArticlePersonaliserById(id: number): Observable<ArticlePersonaliser> {
    return this.http.get<ArticlePersonaliser>(`${this.apiUrl}/${id}`);
  }

 
  getArticlesPersonalisesByStatut(statut: string): Observable<ArticlePersonaliser[]> {
    return this.getArticlePersonalisersByStatut(statut);
  }

  getArticlePersonalisersByStatut(statut: string): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/statut/${statut}`);
  }

  getArticlePersonalisersAujourdhui(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/aujourdhui`);
  }


  createArticlePersonaliser(article: ArticlePersonaliser, emailClient: string): Observable<ArticlePersonaliser> {
    // Correction du point de terminaison pour passer l'email en param de requête
    return this.http.post<ArticlePersonaliser>(
      `${this.apiUrl}/create`, 
      article,
      {
        params: new HttpParams().set('emailClient', emailClient),
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    );
  }
  

 
  update(id: number, article: ArticlePersonaliser, emailClient: string): Observable<ArticlePersonaliser> {
    return this.updateArticlePersonaliser(id, article, emailClient);
  }


  updateArticlePersonaliser(id: number, article: ArticlePersonaliser, emailClient: string): Observable<ArticlePersonaliser> {
    console.log('ArticlePersonaliser envoyé au backend lors update :', article, 'Email Client:', emailClient);
    
    const params = new HttpParams().set('emailClient', emailClient);
    return this.http.put<ArticlePersonaliser>(`${this.apiUrl}/${id}/update`, article, { 
      params,
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour:', error.message, error);
        return throwError(() => new Error(error.message || 'Erreur inconnue'));
      })
    );
  }

  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression:', error.message, error);
        return throwError(() => new Error(error.message || 'Erreur inconnue'));
      })
    );
  }

 
  deleteArticlePersonaliser(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`);
  }

 
  

  getPhotoByName(name: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.apiBaseUrl}/photos/name/${name}`);
  }
  
 
  deletePhoto(id: number): Observable<any> {
    if (id === undefined || id === null) {
      throw new Error('L\'ID de la photo est undefined ou null');
    }
    return this.http.delete<any>(`${this.apiUrl}/photos/${id}`);
  }

  notifierArticlePersonaliser(message: string): Observable<any> {
    return this.http.post('http://127.0.0.1:8080/api/notification/article',message);
  }


   // Récupérer tous les articles personnalisés
   getAllArticlesPersonalises(): Observable<ArticlePersonaliser[]> {
    return this.http.get<ArticlePersonaliser[]>(this.apiUrl)
      .pipe(
        tap(articles => console.log(`${articles.length} articles personnalisés récupérés`)),
        catchError(error => {
          console.error('Erreur lors de la récupération des articles personnalisés:', error);
          return throwError(() => error);
        })
      );
  }



  getArticlesPersonalisesByEmail(email: string): Observable<ArticlePersonaliser[]> {
    // Utilisez this.apiUrl au lieu de this.apiUrl1
    return this.http.get<ArticlePersonaliser[]>(`${this.apiUrl}/client/email/${email}`)
      .pipe(
        tap(articles => console.log(`${articles.length} articles personnalisés récupérés pour l'email ${email}`)),
        catchError(error => {
          console.error(`Erreur lors de la récupération des articles personnalisés pour l'email ${email}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Récupérer toutes les couleurs
  getCouleurs(): Observable<Couleur[]> {
    return this.http.get<Couleur[]>(`${this.apiUrl}/couleurs`);
  }
    
  // Récupérer toutes les pointures
  getPointures(): Observable<Pointure[]> {
    return this.http.get<Pointure[]>(`${this.apiUrl}/pointures`);
  }

 

}