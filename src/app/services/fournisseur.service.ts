import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface pour le modèle Fournisseur
export interface Fournisseur {
  id?: number;
  nom: string;
  email: string;
  adresse: string;
  telephone: string;
  motDePasse?: string;
  logo?: any; // Photo
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
  numeroIdentificationEntreprise?: string;
  materiauxUtilises?: string;
  methodesProduction?: string;
  programmeRecyclage?: string;
  transportLogistiqueVerte?: string;
  initiativesSociales?: string;
  scoreEcologique?: number;
  createdAt?: string;
  evaluatedAt?: string;
  description?: string;
  siteWeb?: string;
  secteurActivite?: string;
  nombreEmployes?: number;
  anneeCreation?: number;
  certifications?: string;
}

// Interface pour les statistiques
export interface FournisseurStats {
  [key: string]: number;
}

// Interface pour l'évolution
export interface EvolutionData {
  categories: string[];
  series: number[];
}

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private baseUrl = 'http://localhost:8080/fournisseur'; // Ajustez selon votre configuration
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  // Récupérer tous les fournisseurs
  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.baseUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  // NOUVELLE FONCTION : Récupérer tous les fournisseurs acceptés
  getAllFournisseursAcceptes(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(`${this.baseUrl}/acceptes`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Récupérer un fournisseur par ID
  getFournisseurById(id: number): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Récupérer un fournisseur par email
  getFournisseurByEmail(email: string): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.baseUrl}/email/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Créer un nouveau fournisseur
  createFournisseur(fournisseur: Fournisseur): Observable<string> {
    return this.http.post<string>(this.baseUrl, fournisseur, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Mettre à jour un fournisseur
  updateFournisseur(id: number, fournisseur: Fournisseur): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.baseUrl}/${id}`, fournisseur, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Supprimer un fournisseur
  deleteFournisseur(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Fonctions utilitaires pour les fournisseurs acceptés
  
  // Filtrer les fournisseurs acceptés par secteur
  getFournisseursAcceptesBySecteur(secteur: string): Observable<Fournisseur[]> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          const filtered = fournisseurs.filter(f => f.secteurActivite === secteur);
          observer.next(filtered);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Filtrer les fournisseurs acceptés par score écologique minimum
  getFournisseursAcceptesByScoreMin(scoreMin: number): Observable<Fournisseur[]> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          const filtered = fournisseurs.filter(f => f.scoreEcologique! >= scoreMin);
          observer.next(filtered);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Rechercher des fournisseurs acceptés par nom ou secteur
  searchFournisseursAcceptes(searchTerm: string): Observable<Fournisseur[]> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          const filtered = fournisseurs.filter(f => 
            f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.secteurActivite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.adresse.toLowerCase().includes(searchTerm.toLowerCase())
          );
          observer.next(filtered);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Obtenir les fournisseurs acceptés triés par score écologique
  getFournisseursAcceptesOrderByScore(ascending: boolean = false): Observable<Fournisseur[]> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          const sorted = fournisseurs.sort((a, b) => {
            const scoreA = a.scoreEcologique || 0;
            const scoreB = b.scoreEcologique || 0;
            return ascending ? scoreA - scoreB : scoreB - scoreA;
          });
          observer.next(sorted);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Obtenir le nombre de fournisseurs acceptés
  countFournisseursAcceptes(): Observable<number> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          observer.next(fournisseurs.length);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Obtenir les statistiques des fournisseurs acceptés par secteur
  getStatsAcceptesBySecteur(): Observable<{[key: string]: number}> {
    return new Observable(observer => {
      this.getAllFournisseursAcceptes().subscribe(
        fournisseurs => {
          const stats: {[key: string]: number} = {};
          fournisseurs.forEach(f => {
            const secteur = f.secteurActivite || 'Non spécifié';
            stats[secteur] = (stats[secteur] || 0) + 1;
          });
          observer.next(stats);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Gestion des erreurs
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}