import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Article } from '../article/article';

// Interface pour structurer la réponse de recherche
export interface SearchResponse {
  success: boolean;
  message: string;
  totalResults: number;
  articles?: Article[];  // Ajouter cette propriété
  products?: Article[];  // Garder cette propriété pour compatibilité
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:8080/api/search';

  constructor(private http: HttpClient) { }

  // Recherche en langage naturel
  naturalLanguageSearch(query: string): Observable<SearchResponse> {
    console.log('Recherche naturelle pour:', query);
    return this.http.post<SearchResponse>(`${this.apiUrl}/query`, { query: query })
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API:', response);
          
          // Normaliser la réponse
          const normalizedResponse: SearchResponse = {
            success: response.success !== undefined ? response.success : true,
            message: response.message || 'Recherche effectuée',
            totalResults: response.totalResults || 0,
            articles: response.articles || response.products || []
          };
          
          console.log('Réponse normalisée:', normalizedResponse);
          return normalizedResponse;
        }),
        catchError(error => {
          console.error('Erreur lors de la recherche naturelle:', error);
          throw error;
        })
      );
  }

  // Recherche par mot-clé
  searchByKeyword(keyword: string): Observable<Article[]> {
    console.log('Recherche par mot-clé pour:', keyword);
    return this.http.get<Article[]>(`${this.apiUrl}/keyword?keyword=${keyword}`)
      .pipe(
        map(articles => {
          console.log('Articles trouvés par mot-clé:', articles);
          return articles;
        }),
        catchError(error => {
          console.error('Erreur lors de la recherche par mot-clé:', error);
          throw error;
        })
      );
  }

  // Recherche par catégorie
  searchByCategory(category: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/category/${category}`);
  }

  // Recherche par genre
  searchByGenre(genre: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/genre/${genre}`);
  }

  // Test de recherche - endpoint simplifié
  testSearch(query: string): Observable<SearchResponse> {
    console.log('Test de recherche pour:', query);
    return this.http.post<SearchResponse>(`${this.apiUrl}/query-test`, { query: query });
  }
}