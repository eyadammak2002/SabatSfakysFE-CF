import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Photo } from '../photo/Photo';
import { Article } from '../article/article';
import { Genre } from '../produit/Genre';


export interface Avis {
  id?: number;
  description: string;
  dateAjout?: string;
  photos: Photo[];
  client?: Client;
  article?: Article;
}

export interface Client {
  id?: number;
  username: string;
  email: string;
  adresse: string;
  telephone: string;
  password?: string;
  sexe?: Genre;
}

@Injectable({
  providedIn: 'root'
})
export class AvisService {

  private apiUrl = 'http://localhost:8080/api/avis';

  constructor(private http: HttpClient) {}

  // Récupérer tous les avis
  getAllAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(this.apiUrl);
  }

  // Récupérer un avis par ID
  getAvisById(id: number): Observable<Avis> {
    return this.http.get<Avis>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouvel avis
 // Créer un nouvel avis
/*createAvis(avis: Avis, userId: number, articleId: number): Observable<Avis> {
  return this.http.post<Avis>(`${this.apiUrl}?userId=${userId}&articleId=${articleId}`, avis);
}
*/

  createAvis(avis: any, userId: number, articleId: number): Observable<Avis> {
    // Créer un nouvel objet pour éviter d'envoyer des propriétés inutiles
    const avisData = {
      description: avis.description,
      note: avis.note,
      // Envoyer uniquement les photos nécessaires avec leur ID
      photos: avis.photos.map((photo: Photo) => ({
        id: photo.id,
        name: photo.name
      }))
    };

    // Envoi de la requête avec les paramètres userId et articleId
    return this.http.post<Avis>(`${this.apiUrl}?userId=${userId}&articleId=${articleId}`, avisData);
  }

  // Récupérer l'utilisateur d'un avis
  getUserFromAvis(avisId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${avisId}/user`);
  }


  // Modifier un avis existant
  updateAvis(id: number, avis: Avis): Observable<Avis> {
    return this.http.put<Avis>(`${this.apiUrl}/${id}`, avis);
  }

  // Supprimer un avis
  deleteAvis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvisByArticleId(articleId: number): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/article/${articleId}`);
  }
}
