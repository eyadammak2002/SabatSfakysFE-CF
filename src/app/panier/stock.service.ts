import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  private apiUrl = 'http://localhost:8080/stock';

  constructor(private http: HttpClient) {}

  getStockQuantity(articleId: number, couleurId: number, pointureId: number): Observable<number> {
    const url = `${this.apiUrl}/quantite?articleId=${articleId}&couleurId=${couleurId}&pointureId=${pointureId}`;
    return this.http.get<number>(url);
  }

  deleteStock(stockId: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete-stock/${stockId}`, { responseType: 'text' });
  }

  updateStock(stockId: number, quantite: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}/update-stock/${stockId}`, null, { 
      params: new HttpParams().set('quantite', quantite.toString()),
      responseType: 'text'
    });
  }
  
}
