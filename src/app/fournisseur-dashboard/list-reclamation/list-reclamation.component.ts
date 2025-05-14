import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ArticlePersonaliserService } from 'src/app/article-personaliser/article-personaliser.service';
import { Reclamation, ReclamationService } from 'src/app/services/reclamation.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-list-reclamation',
  templateUrl: './list-reclamation.component.html',
  styleUrls: ['./list-reclamation.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
  ],
})
export class ListReclamationComponent implements OnInit {
  nonResolvedReclamations: Reclamation[] = [];
  resolvedReclamations: Reclamation[] = [];
  activeTab: 'nonResolved' | 'resolved' = 'nonResolved';
  loading = true;
  error = '';
  fournisseurId: number = 0;

  constructor(
    private reclamationService: ReclamationService,
    private tokenStorage: TokenStorageService,
    private articlePersonaliserService: ArticlePersonaliserService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    
    // Récupérer l'utilisateur connecté
    const user = this.tokenStorage.getUser();
    
    if (user && user.email) {
      console.log('Email de l\'utilisateur connecté:', user.email);
      
      // Utiliser la méthode du service ArticlePersonaliserService pour récupérer l'ID fournisseur
      this.articlePersonaliserService.getFournisseurIdByEmail(user.email).subscribe({
        next: (frId) => {
          this.fournisseurId = frId;
          console.log('ID du fournisseur récupéré:', this.fournisseurId);
          this.loadReclamationsForFournisseur();
        },
        error: (error) => {
          console.error('Erreur lors de la récupération de l\'ID fournisseur:', error);
          this.loading = false;
          this.error = "Impossible de récupérer l'ID du fournisseur associé à cet utilisateur.";
        }
      });
    } else {
      console.error('Utilisateur non connecté ou email manquant');
      this.loading = false;
      this.error = "Vous devez être connecté pour accéder à cette page.";
    }
  }

  loadReclamationsForFournisseur(): void {
    if (!this.fournisseurId) {
      this.error = "ID de fournisseur invalide";
      this.loading = false;
      return;
    }
    
    // Charger les réclamations non résolues pour ce fournisseur
    this.reclamationService.getNonResolvedReclamationsByFournisseurId(this.fournisseurId).subscribe({
      next: (data) => {
        this.nonResolvedReclamations = data;
        console.log(`Réclamations non résolues pour le fournisseur ${this.fournisseurId}:`, data);
        this.checkLoading();
      },
      error: (error) => {
        console.error(`Erreur lors du chargement des réclamations non résolues pour le fournisseur ${this.fournisseurId}:`, error);
        this.error = "Erreur lors du chargement des réclamations non résolues.";
        this.checkLoading();
      }
    });

    // Charger les réclamations résolues pour ce fournisseur
    this.reclamationService.getResolvedReclamationsByFournisseurId(this.fournisseurId).subscribe({
      next: (data) => {
        this.resolvedReclamations = data;
        console.log(`Réclamations résolues pour le fournisseur ${this.fournisseurId}:`, data);
        this.checkLoading();
      },
      error: (error) => {
        console.error(`Erreur lors du chargement des réclamations résolues pour le fournisseur ${this.fournisseurId}:`, error);
        this.error = "Erreur lors du chargement des réclamations résolues.";
        this.checkLoading();
      }
    });
  }

  // Méthode pour vérifier si le chargement est terminé
  checkLoading(): void {
    // Désactiver le chargement une fois que les deux appels API sont terminés
    this.loading = false;
  }

  markAsResolved(id: number): void {
    this.loading = true; // Activer le chargement pendant l'opération
    this.reclamationService.markReclamationAsResolved(id).subscribe({
      next: (resolvedReclamation) => {
        console.log('Réclamation marquée comme résolue:', resolvedReclamation);
        // Mettre à jour les listes après la résolution
        this.loadReclamationsForFournisseur();
      },
      error: (error) => {
        console.error('Erreur lors de la résolution de la réclamation:', error);
        this.error = "Erreur lors de la résolution de la réclamation.";
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'nonResolved' | 'resolved'): void {
    this.activeTab = tab;
  }

  // Méthode pour rafraîchir les données
  refreshData(): void {
    this.loading = true;
    this.loadReclamationsForFournisseur();
  }

  // Méthode pour obtenir le total des réclamations
getTotalReclamations(): number {
  return this.nonResolvedReclamations.length + this.resolvedReclamations.length;
}
}