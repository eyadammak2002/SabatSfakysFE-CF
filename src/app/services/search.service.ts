// search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Article } from '../article/article';

export interface SearchResponse {
  products: any[];
  message: string;
  success: boolean;
  totalResults: number;
}

export interface SearchRequest {
  category?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  material?: string;
  size?: string;
  query?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:8080/api/search'; // Adaptez l'URL à votre backend

  constructor(private http: HttpClient) {}

  // Recherche par mot-clé
  searchByKeyword(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/keyword?keyword=${keyword}`)
      .pipe(
        catchError(this.handleError<any[]>('searchByKeyword', []))
      );
  }

  // Recherche par catégorie
  searchByCategory(category: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/${category}`)
      .pipe(
        catchError(this.handleError<any[]>('searchByCategory', []))
      );
  }

  // Recherche par genre
  searchByGenre(genre: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/genre/${genre}`)
      .pipe(
        catchError(this.handleError<any[]>('searchByGenre', []))
      );
  }

  // Recherche par catégorie et genre
  searchByCategoryAndGenre(category: string, genre: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/${category}/genre/${genre}`)
      .pipe(
        catchError(this.handleError<any[]>('searchByCategoryAndGenre', []))
      );
  }

  // Recherche avancée avec critères multiples
  advancedSearch(request: SearchRequest): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/advanced`, request)
      .pipe(
        catchError(this.handleError<any[]>('advancedSearch', []))
      );
  }

  // Recherche en langage naturel
  naturalLanguageSearch(query: string): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${this.apiUrl}/query`, { query })
      .pipe(
        catchError(this.handleError<SearchResponse>('naturalLanguageSearch', {
          products: [],
          message: 'Une erreur est survenue lors de la recherche.',
          success: false,
          totalResults: 0
        }))
      );
  }

  // Gestion des erreurs
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}