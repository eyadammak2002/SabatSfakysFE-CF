import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pack } from './pack'; // Correct model name
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PacksService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/pack'; //  API URL

  // Get all packs
  getAll(): Observable<Pack[]> {
    return this.http.get<Pack[]>(this.apiUrl);
  }

  //  Get pack by ID
  getById(id: number): Observable<Pack> {
    return this.http.get<Pack>(`${this.apiUrl}/${id}`);
  }

  //  Create a new pack
  create(pack: Pack): Observable<Pack> {
    return this.http.post<Pack>(this.apiUrl, pack);
  }

  //  Update an existing pack (Pass ID in URL)
  update(id: number, pack: Pack): Observable<Pack> {
    return this.http.put<Pack>(`${this.apiUrl}/${id}`, pack);
  }

  // Delete pack by ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
