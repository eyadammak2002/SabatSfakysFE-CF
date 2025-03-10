import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Produit } from './produit';
import { ProduitService } from './produit.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-produit',
    standalone: true,
    imports: [
      FormsModule,
      CommonModule,
      RouterModule,
    ],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.css']
})
export class ProduitComponent {

 displayedColumns = ['id', 'name','description', 'dateFond', 'fondateur' ,'photo','contact', 'actions'];
  selectedProduit!: Produit;
  allProduit: Produit[] = [];
  feedback: any = {};
  deleteModal: any;
  idTodelete: number = 0;

  constructor(private produitService: ProduitService
    ,private router:Router,
  ) {}
 
  ngOnInit(): void {
    this.getAllProduit();
  }
 
  getAllProduit() {
    this.produitService.get().subscribe((data:Produit[]) => {
      this.allProduit= data;
      console.log("allEmployes : ", this.allProduit);
    });
  }
  openDeleteModal(id: number) {
    this.idTodelete = id;
    this.deleteModal.show();
  }
 
  select(selected: Produit): void {
    this.selectedProduit = selected;
  }
  normalizeStatut(statut: string): string {
    return statut ? statut.toUpperCase().trim() : 'EN_ATTENTE';
  }
  
  delete(produit: Produit): void {
    // Afficher une confirmation avant de supprimer
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      // Appeler le service de suppression
      this.produitService.delete(produit.id).subscribe({
        next: () => {
          // Filtrer la liste des produits pour exclure celui qui a été supprimé
          this.allProduit = this.allProduit.filter(p => p.id !== produit.id);
          // Afficher un message de succès
          this.feedback = { type: 'success', message: 'La suppression a été effectuée avec succès !' };
          // Effacer le message de retour après 3 secondes
          setTimeout(() => {
            this.feedback = null;
          }, 3000);
        },
        error: (err) => {
          // Afficher un message d'erreur en cas de problème
          this.feedback = { type: 'warning', message: 'Erreur lors de la suppression.' };
          console.error('Erreur lors de la suppression du produit:', err);
        }
      });
    }
  }
  


  getEditProduitUrl(id: number): string {
      return `/editProduit/${id}`;
  }

  redirectToCreateProduit() {
    this.router.navigate(['createProduit']);
  }

  redirectToProduit(): void {
    this.router.navigate(['produit']); // Redirige vers la page de création d'produit
  }
  navigateToEditProduit(produitId: number): void {
      this.router.navigate(['/editProduit', produitId]);
  }

    // Méthode pour encoder le nom du fichier
    encodePhotoName(name: string): string {
      return decodeURIComponent(name);
    }

}

