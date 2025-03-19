import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { Article } from '../article';
import { ArticleService } from '../article.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css']
})
export class CreateArticleComponent {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];

  articleForm: Article = {
    id: 0,
    ref: '',
    name: '',
    description: '',
    qte: 0,
    prixFournisseur: 0,
    prixVente: 0,
    couleurs: [],
    pointures: [],
    genre: 'FEMME',
    tissu: 'CUIR',
    statut: 'EN_ATTENTE',
    category: { id: 0, name: '', description: '' },
    photos: [],
    fournisseur: {  // Initialisation de fournisseur avec les propriétés de l'interface
      id: 0,
      nom: '',
      email: '',
      adresse: '',
      telephone: '',
      motDePasse: '',
      statut: 'EN_ATTENTE',
      logo: { id: 0,name:'', url: '' }  // Remplacez par un objet Photo valide si nécessaire
    }
  };

  couleursDisponibles = ["black", "white", "Red", "Blue", "maroon", "yellow", "Gris"];
  pointuresDisponibles = ["36", "37", "38", "39", "40", "41", "42", "43", "44"];

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService,
    private tokenStorageService: TokenStorageService // Injectez le service TokenStorageService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
    this.getCategory();

    // Utilisez TokenStorageService pour récupérer l'email de l'utilisateur connecté
    const user = this.tokenStorageService.getUser();
    if (user && user.email) {
      this.articleForm.fournisseur.email = user.email;  // Assignez l'email du fournisseur
    } else {
      console.error('Aucun utilisateur connecté');
    }
  }

  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => (this.allPhoto = data),
      error: (err) => console.error(err)
    });
  }

  getCategory(): void {
    this.categoryService.get().subscribe({
      next: (data) => (this.allCategory = data),
      error: (err) => console.error(err)
    });
  }

  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photo);
    }
    this.articleForm.photos = [...this.selectedPhotos];
  }

  toggleCouleur(couleur: string): void {
    const index = this.articleForm.couleurs.indexOf(couleur);
    if (index > -1) {
      this.articleForm.couleurs.splice(index, 1);
    } else {
      this.articleForm.couleurs.push(couleur);
    }
  }

  togglePointure(pointure: string): void {
    const index = this.articleForm.pointures.indexOf(pointure);
    if (index > -1) {
      this.articleForm.pointures.splice(index, 1);
    } else {
      this.articleForm.pointures.push(pointure);
    }
  }

  save(): void {
    console.log('Article Form to submit:', this.articleForm);

    if (!this.articleForm.fournisseur.email ) {
      console.error('Erreur: fournisseurEmail est requis');
      return;
    }

    this.articleService.create(this.articleForm, this.articleForm.fournisseur.email ).subscribe({
      next: (data) => {
        console.log('Article créé avec succès:', data);
        this.router.navigate(['/article']);
      },
      error: (err) => {
        console.error("Erreur lors de la création de l'article:", err);
      }
    });
  }

  redirectToArticles(): void {
    this.router.navigate(['/article']);
  }
}
