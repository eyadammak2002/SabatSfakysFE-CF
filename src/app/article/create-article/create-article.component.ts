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

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [    FormsModule,CommonModule,CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,MatIconModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css']
})
export class CreateArticleComponent {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];

  articleForm: Article = {
    id:0,
    ref: '',
    name: '',
    description: '',
    qte: 0,
    prixFournisseur: 0,
    prixVente: 0,
    couleur: 'NOIR',
    genre: 'FEMME',
    tissu: 'CUIR',
    statut: 'EN_ATTENTE',
    category: { id: 0, name: '' ,description:''},
    photos: []
  };

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
    this.getCategory();
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

  save() {
    console.log('Article Form to submit:', this.articleForm);
    this.articleService.create(this.articleForm)
      .subscribe({
        next: (data) => {
          console.log('Article créé avec succès:', data);
          this.router.navigate(['/article']);
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'article:', err);
          console.log('Détails de l\'erreur:', err.error);
        }
        
      });
  }

  

  
 

  redirectToArticles(): void {
    this.router.navigate(['/article']);
  }
}
