import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = 'http://localhost:8080/commande/api/paiement'; // Endpoint backend

  constructor(private http: HttpClient) {}

  simulerPaiement(montant: any, methode: any, details: { numero: any, expiration: any, cvv: any }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/simuler`, { montant, methode, details });
  }
  
}
