import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'http://localhost:8080/stock';

  constructor(private http: HttpClient) {}

  // Méthode existante pour obtenir la quantité en stock
  getStockQuantity(articleId: number, couleurId: number, pointureId: number): Observable<number> {
    const url = `${this.apiUrl}/quantite?articleId=${articleId}&couleurId=${couleurId}&pointureId=${pointureId}`;
    return this.http.get<number>(url);
  }

  // Méthode existante pour supprimer un stock
  deleteStock(stockId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-stock/${stockId}`, { responseType: 'text' });
  }

  // Méthode existante pour mettre à jour un stock
  updateStock(stockId: number, quantite: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/update-stock/${stockId}`, null, {
      params: new HttpParams().set('quantite', quantite.toString()),
      responseType: 'text'
    });
  }

  // Nouvelle méthode pour vérifier si le stock est disponible pour une quantité demandée
  checkStockAvailability(articleId: number, couleurId: number, pointureId: number, quantity: number = 1): Observable<boolean> {
    const url = `${this.apiUrl}/verification`;
    const params = new HttpParams()
      .set('articleId', articleId.toString())
      .set('couleurId', couleurId.toString())
      .set('pointureId', pointureId.toString())
      .set('quantity', quantity.toString());
    
    return this.http.get<boolean>(url, { params });
  }
}