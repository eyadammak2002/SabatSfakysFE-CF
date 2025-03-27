import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { Article, Couleur, Pointure, Stock } from '../article';
import { ArticleService } from '../article.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css']
})
export class CreateArticleComponent {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];
  couleursDisponibles: Couleur[] = [];
  pointuresDisponibles: Pointure[] = [];
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  quantite: number = 0;

  articleStocks: Stock[] = [];

  articleForm: Article = {
    id: 0,
    ref: '',
    name: '',
    description: '',
    stocks: [
      {
        id: 0,
        couleur: { id: 0, nom: '' },
        pointure: { id: 0, taille: 0  },
        quantite: 0
      }
    ],
    prixFournisseur: 0,
    prixVente: 0,
    genre: 'FEMME',
    tissu: 'CUIR',
    statut: 'EN_ATTENTE',
    category: { id: 0, name: '', description: '' },
    photos: [],
    fournisseur: {
      id: 0,
      nom: '',
      email: '',
      adresse: '',
      telephone: '',
      motDePasse: '',
      statut: 'EN_ATTENTE',
      logo: { id: 0, name: '', url: '' }
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService,
    private tokenStorageService: TokenStorageService
  ) {}

  ngOnInit(): void {
    this.getCouleurs();
    this.getPointures();
    this.getPhotos();
    this.getCategory();
    const user = this.tokenStorageService.getUser();
    if (user && user.email) {
      this.articleForm.fournisseur.email = user.email;
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


  getCouleurs(): void {
    this.articleService.getCouleurs().subscribe({
      next: (data) => {
        this.couleursDisponibles = data;
        console.log('✅ Couleurs récupérées:', this.couleursDisponibles);
      },
      error: (err) => console.error('❌ Erreur lors de la récupération des couleurs', err)
    });
  }
  
  getPointures(): void {
    this.articleService.getPointures().subscribe({
      next: (data) => {
        this.pointuresDisponibles = data;
        console.log('✅ Pointures récupérées:', this.pointuresDisponibles);
      },
      error: (err) => console.error('❌ Erreur lors de la récupération des pointures', err)
    });
  }
  
  generateStocks(): void {
    if (this.selectedCouleur && this.selectedPointure && this.quantite > 0) {
      const stock: Stock = {
        id: 0, 
        couleur: this.selectedCouleur,
        pointure: this.selectedPointure,
        quantite: this.quantite
      };
      console.log('📌 Stock généré:', stock);
      this.articleStocks.push(stock);
      console.log('📦 Liste des stocks après ajout:', this.articleStocks);
    } else {
      console.error('❌ Veuillez sélectionner une couleur, une pointure et une quantité.');
    }
  }
  

  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photo);
    }
    this.articleForm.photos = [...this.selectedPhotos];
    this.cdr.markForCheck(); // Trigger change detection
    console.log('Selected Photos:', this.articleForm.photos);
  }

  onSubmit() {
    if (this.articleForm.ref && this.articleForm.name && this.articleForm.prixFournisseur && this.articleForm.photos.length > 0 && this.articleStocks.length > 0) {
      this.articleForm.stocks = [...this.articleStocks];
      
      const emailFournisseur = this.articleForm.fournisseur.email;
      
      this.articleService.create(this.articleForm, emailFournisseur).subscribe({
        next: (data) => {
          console.log('Article créé avec succès', data);
          this.router.navigate(['/article']);
        },
        error: (err) => console.error('Erreur lors de la création de l\'article', err)
      });
    } else {
      console.error('Veuillez remplir tous les champs obligatoires');
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/article']);
  }
}