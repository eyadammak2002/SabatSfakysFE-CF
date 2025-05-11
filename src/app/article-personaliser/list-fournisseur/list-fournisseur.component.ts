import { Component, OnInit } from '@angular/core';
import { Fournisseur } from 'src/app/pack/Fournisseur';
import { ArticlePersonaliserService } from '../article-personaliser.service';

@Component({
  selector: 'app-list-fournisseur',
  templateUrl: './list-fournisseur.component.html',
  styleUrls: ['./list-fournisseur.component.css']
})
export class ListFournisseurComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  selectedFournisseurId: number | null = null;
  selectedFournisseur: Fournisseur | null = null;

  constructor(private articlePersonaliserService: ArticlePersonaliserService) {}

  ngOnInit(): void {
    this.getFournisseurs();
  }

  getFournisseurs(): void {
    this.articlePersonaliserService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        console.log('Fournisseurs récupérés:', this.fournisseurs);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des fournisseurs:', err);
      }
    });
  }

  onFournisseurSelect(event: Event): void {
    const selectedId = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedFournisseurId = selectedId;
    this.selectedFournisseur = this.fournisseurs.find(f => f.id === selectedId) || null;
    console.log('Fournisseur sélectionné:', this.selectedFournisseur);
  }
}
