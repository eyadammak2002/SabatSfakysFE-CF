// Correction frontend pour s'adapter aux nouvelles définitions
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RevenusFournisseurService {
  // URL correcte avec le pluriel
  private apiUrl = 'http://localhost:8080/panier/revenus-fournisseurs';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les données de revenus du fournisseur
   */
  getRevenusFournisseur(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(response => {
        console.log('Réponse API brute:', response);
        
        // Trouver les données du fournisseur connecté
        // Dans un vrai système, vous filtreriez par ID du fournisseur connecté
        if (response && response.length > 0) {
          // Trouver le fournisseur actuellement connecté (pour l'exemple, on prend le premier)
          const fournisseurData = response[0];
          console.log('Données du fournisseur:', fournisseurData);
          
          // Transformer la réponse au format attendu par le composant
          return {
            revenuJourCourant: fournisseurData.revenuJourCourant || 0,
            revenuSemaineCourant: fournisseurData.revenuSemaineCourant || 0,
            revenuMoisCourant: fournisseurData.revenuMoisCourant || 0,
            revenuAnneeCourante: fournisseurData.revenuAnneeCourante || 0,
            revenuTotal: fournisseurData.revenuTotal || 0,
            revenuNet10Pourcent: fournisseurData.revenuNet10Pourcent || 0,
            revenus: fournisseurData.revenus || []
          };
        }
        
        // Retourner une structure vide si aucune donnée
        return {
          revenuJourCourant: 0,
          revenuSemaineCourant: 0,
          revenuMoisCourant: 0,
          revenuAnneeCourante: 0,
          revenuTotal: 0,
          revenuNet10Pourcent: 0,
          revenus: []
        };
      })
    );
  }

  /**
   * Récupère les données de revenus pour une période spécifique
   * @param periode La période (jour, semaine, mois, année)
   */
  getRevenusByPeriode(periode: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/periode/${periode}`);
  }

  /**
   * Récupère les données de revenus pour un article spécifique
   * @param articleId ID de l'article
   */
  getRevenusByArticle(articleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/article/${articleId}`);
  }
}