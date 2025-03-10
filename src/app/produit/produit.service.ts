import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Produit } from './produit';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = 'http://127.0.0.1:8080/produit';

  constructor(private http: HttpClient) {}
  
  
  get() {
    return this.http.get<Produit[]>('http://127.0.0.1:8080/produit');
  }
    // Créer un nouvel produit
  createProduit(produit: Produit): Observable<number> {
      return this.http.post<number>(this.apiUrl, produit);
    }
  
  getById(id: number) {
    return this.http.get<Produit>(`http://127.0.0.1:8080/produit/${id}`);
   }
    
   update(id: number, payload: Produit) {
    return this.http.put(`http://127.0.0.1:8080/produit/${id}`, payload);
  }
  
  
   delete(id:number){
    return this.http.delete<Produit>(`http://127.0.0.1:8080/produit/${id}`);
 }
}
