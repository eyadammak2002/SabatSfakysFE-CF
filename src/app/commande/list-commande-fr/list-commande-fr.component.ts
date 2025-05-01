import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, switchMap } from 'rxjs';
import { Panier, PanierService, LignePanier } from 'src/app/services/panier.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-list-commande-fr',
    standalone: true,
    imports: [FormsModule, CommonModule, NgClass],
  templateUrl: './list-commande-fr.component.html',
  styleUrls: ['./list-commande-fr.component.css']
})
export class ListCommandeFRComponent implements OnInit {
  commandes: Panier[] = [];
  userId!: number;
  userEmail!: string;
  fournisseurId!: number;
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private panierService: PanierService,
    private tokenStorage: TokenStorageService
  ) {}

  ngOnInit(): void {
    const user = this.tokenStorage.getUser();
    this.userId = user.id;
    this.userEmail = user.email;
    
    // D'abord récupérer l'ID du fournisseur à partir de l'email
    this.getFournisseurIdAndLoadCommandes();
  }

  getFournisseurIdAndLoadCommandes(): void {
    this.isLoading = true;
    this.panierService.getFournisseurByEmail(this.userEmail).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du fournisseur:', error);
        this.errorMessage = 'Erreur lors de la récupération des informations du fournisseur.';
        this.isLoading = false;
        return of(null); // Retourner un Observable qui émet null en cas d'erreur
      }),
      switchMap(fournisseur => {
        if (fournisseur) {
          this.fournisseurId = fournisseur.id;
          return this.panierService.getCommandesByFournisseur(this.fournisseurId);
        } else {
          this.errorMessage = 'Impossible de trouver les informations du fournisseur.';
          return of([]); // Retourner un Observable vide si le fournisseur n'est pas trouvé
        }
      })
    ).subscribe({
      next: (data) => {
        this.commandes = data;
        
        // Parcours chaque lignePanier pour récupérer son article
        this.commandes.forEach((commande) => {
          commande.lignesPanier.forEach((ligne) => {
            this.panierService.getArticleFromLignePanier(ligne.id).subscribe({
              next: (article) => {
                ligne.article = article;
              },
              error: (err) => {
                console.error(`Erreur lors de la récupération de l'article pour la ligne ${ligne.id}`, err);
              }
            });
          });
        });
        
        console.log('Commandes reçues :', this.commandes);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commandes : ', err);
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement des commandes.';
      }
    });
  }

  // Méthode pour marquer une ligne de panier comme livrée (LIVRER_FR)
  marquerCommeLivree(ligne: LignePanier): void {
    this.isLoading = true;
    this.panierService.changerStatutEnLivrerFr([ligne.id]).subscribe({
      next: (response) => {
        console.log('Statut changé avec succès:', response);
        ligne.statut = 'LIVRER_FR';
        this.successMessage = `✅ La ligne pour l'article ${ligne.article.name} a été marquée comme livrée.`;
        this.isLoading = false;
        
        // Message disparaît après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors du changement de statut:', err);
        this.errorMessage = `❌ Erreur lors du changement de statut: ${err.message || err}`;
        this.isLoading = false;
        
        // Message d'erreur disparaît après 3 secondes
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  // Méthode pour marquer toutes les lignes d'une commande comme livrées (LIVRER_FR)
  marquerToutesCommeLivrees(commande: Panier): void {
    const ligneIds = commande.lignesPanier.map(ligne => ligne.id);
    
    if (ligneIds.length === 0) {
      this.errorMessage = "Aucune ligne à marquer comme livrée.";
      return;
    }
    
    this.isLoading = true;
    this.panierService.changerStatutEnLivrerFr(ligneIds).subscribe({
      next: (response) => {
        console.log('Statuts changés avec succès:', response);
        commande.lignesPanier.forEach(ligne => ligne.statut = 'LIVRER_FR');
        this.successMessage = `✅ Toutes les lignes de la commande #${commande.id} ont été marquées comme livrées.`;
        this.isLoading = false;
        
        // Message disparaît après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors du changement de statut:', err);
        this.errorMessage = `❌ Erreur lors du changement de statut: ${err.message || err}`;
        this.isLoading = false;
        
        // Message d'erreur disparaît après 3 secondes
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }
  
  // Vérifier si une ligne peut être marquée comme livrée (n'est pas déjà LIVRER_FR)
  peutEtreMarqueeLivree(ligne: LignePanier): boolean {
    return ligne.statut !== 'LIVRER_FR';
  }
  
  // Vérifier si toutes les lignes d'une commande sont livrées
  toutesLignesLivrees(commande: Panier): boolean {
    return commande.lignesPanier.every(ligne => ligne.statut === 'LIVRER_FR');
  }
}