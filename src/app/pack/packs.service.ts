import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Packs } from './pack';

@Injectable({
  providedIn: 'root', // Le service est fourni au niveau racine
})
export class PacksService {
  private http = inject(HttpClient); // Injection de HttpClient avec inject()

  // Récupérer tous les packs
  get() {
    return this.http.get<Packs[]>('http://localhost:8080/pack');
  }

  // Créer un nouvel pack
  create(payload: Packs) {
    return this.http.post<Packs>('http://localhost:8080/pack', payload);
  }

  // Récupérer un pack par son ID
  getById(id: number) {
    return this.http.get<Packs>(`http://localhost:8080/pack/${id}`);
  }

  // Mettre à jour un pack
  update(payload: Packs) {
    return this.http.put(`http://localhost:8080/pack`, payload);
  }

  // Supprimer un pack par son ID
  delete(id: number) {
    return this.http.delete<Packs>(`http://localhost:8080/pack/${id}`);
  }
}