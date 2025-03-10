import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { Produit } from '../produit';
import { ProduitService } from '../produit.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Couleur } from '../Couleur';
import { Genre } from '../Genre';
import { Statut } from '../Statut';
import { Tissu } from '../Tissu';

@Component({
  selector: 'app-create-produit',
  standalone: true,
  imports: [FormsModule,CommonModule,],
  templateUrl: './create-produit.component.html',
  styleUrls: ['./create-produit.component.css']
})
export class CreateProduitComponent {

  allPhoto: Photo[] = [];

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
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
  }

  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => (this.allPhoto = data),
      error: (err) => console.error(err)
    });
  }

  saveProduit(): void {
    console.log("Produit Form to submit:", this.produitForm); // ✅ Debugging Step
  
    this.produitService.createProduit(this.produitForm).subscribe({
      next: () => this.router.navigate(['/produit']),
      error: (err) => console.error("Erreur lors de la création du produit:", err)
    });
  }
  

  redirectToProduits(): void {
    this.router.navigate(['/produit']);
  }

 
}

