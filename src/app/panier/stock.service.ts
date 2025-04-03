import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
