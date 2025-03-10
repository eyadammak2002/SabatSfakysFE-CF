import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { ProduitService } from '../produit.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Produit } from '../produit';
import { Couleur } from '../Couleur';
import { Genre } from '../Genre';
import { Statut } from '../Statut';
import { Tissu } from '../Tissu';

@Component({
  selector: 'app-edit-produit',
  standalone: true,
  imports: [FormsModule,CommonModule,],
  templateUrl: './edit-produit.component.html',
  styleUrls: ['./edit-produit.component.css']
})
export class EditProduitComponent {

allPhoto: Photo[] = [];
  selectedPhotos: Photo[] = [];

  produitForm: Produit = {
    id: 0,
    ref: '',
    name: '',
    description: '',
    qte: 0,
    prixFournisseur: 0,
    prixVente: 0,
    couleur: Couleur.NOIR, // Using Enum
    genre: Genre.FEMME, // Using Enum
    tissu: Tissu.CUIR, // Using Enum
    statut: Statut.EN_ATTENTE // Using Enum
  };

  constructor(
    private produitService: ProduitService,

    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
 
  }






  update(): void {
    this.produitService.update(this.produitForm.id, this.produitForm)
    .subscribe({
      next: () => this.router.navigate(['/produit']),
      error: (err) => console.error(err)
    });
  }


  redirectToProduits(): void {
    this.router.navigate(['/produit']);
  }
}
