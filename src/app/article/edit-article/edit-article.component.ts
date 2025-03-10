import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotoService } from 'src/app/photo/photo.service';
import { Photo } from 'src/app/photo/Photo';
import { Article } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  
  ],
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.css']
})
export class EditArticleComponent {
  allPhoto: Photo[] = [];
  selectedPhotos: Photo[] = [];

  articleForm: Article = {
    id: 0,
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
    category: { id: 0, name: '', description: '' },
    photos: []
  };

  constructor(
    private articleService: ArticleService,
    private photoService: PhotoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log("Chargement du composant...");
    this.getPhotos();
    this.loadArticle();
  }

  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => {
        this.allPhoto = data;
        console.log("Liste des photos récupérées:", this.allPhoto);
      },
      error: (err) => console.error("Erreur lors de la récupération des photos:", err)
    });
  }

  loadArticle(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log("ID récupéré depuis l'URL:", id);
    
    if (!id) {
      console.error("Aucun ID d'article trouvé dans l'URL !");
      return;
    }

    this.articleService.getById(id).subscribe({
      next: (data) => {
        this.articleForm = data;
        this.selectedPhotos = data.photos || [];
        console.log("Données de l'article récupérées:", this.articleForm);
      },
      error: (err) => console.error("Erreur lors de la récupération de l'article:", err)
    });
  }

  isPhotoSelected(photo: Photo): boolean {
    return this.selectedPhotos.some(p => p.id === photo.id);
  }

  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photo);
    }
    this.articleForm.photos = [...this.selectedPhotos];
    console.log("Photos sélectionnées mises à jour:", this.selectedPhotos);
  }

  update(): void {
    console.log("Données envoyées pour la mise à jour:", this.articleForm);
  
    this.articleService.update(this.articleForm.id, this.articleForm)
      .subscribe({
        next: () => {
          console.log("Mise à jour réussie !");
          this.router.navigate(['/article']);
        },
        error: (err) => console.error("Erreur lors de la mise à jour:", err)
      });
  }
  

  redirectToArticles(): void {
    this.router.navigate(['/article']);
  }
}