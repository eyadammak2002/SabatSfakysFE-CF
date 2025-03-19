import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotoService } from 'src/app/photo/photo.service';
import { Photo } from 'src/app/photo/Photo';
import { Article } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';

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
  allCategory: Category[] = [];

  availableColors: string[] = ['NOIR', 'MARRON', 'BLANC', 'ROUGE', 'BLEU'];
  availableSizes: string[] = ['36', '37', '38', '39', '40', '41', '42', '43'];

  // Remplacer fournisseurId par fournisseurEmail
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

  constructor(
    private articleService: ArticleService,
    private photoService: PhotoService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.getPhotos();
    this.loadArticle();
    this.getCategory();


  
    
  }

  loadArticle(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));  // Récupère l'ID de l'article depuis l'URL
    if (!id) return;
    
    // Appel à votre service pour récupérer l'article
    this.articleService.getById(id).subscribe({
      next: (article) => {
        this.articleForm = { ...article };  // Copiez les données de l'article dans le formulaire
        // Si fournisseurEmail est manquant, affectez-le ici
        if (!this.articleForm.fournisseur.email) {
          this.articleForm.fournisseur.email = article.fournisseur.email; // Assurez-vous que fournisseurEmail est défini
        }
      },
      error: (err) => console.error('Erreur lors du chargement de l\'article:', err)
    });
  }

  getPhotos(): void {
    this.photoService.get().subscribe(data => {
      this.allPhoto = data;
      // Mettre à jour les photos sélectionnées après le chargement
      this.selectedPhotos = this.articleForm.photos || [];
    });
  }

  isPhotoSelected(photo: Photo): boolean {
    return this.articleForm.photos.some(p => p.id === photo.id);
  }

  getCategory(): void {
    this.categoryService.get().subscribe(data => {
      this.allCategory = data;
      this.articleForm.category = this.allCategory.find(cat => cat.id === this.articleForm.category?.id) || null;
    });
  }

  toggleSelection(value: string, type: 'color' | 'size'): void {
    if (type === 'color') {
      this.articleForm.couleurs = this.articleForm.couleurs.includes(value) ?
        this.articleForm.couleurs.filter(c => c !== value) :
        [...this.articleForm.couleurs, value];
    } else {
      this.articleForm.pointures = this.articleForm.pointures.includes(value) ?
        this.articleForm.pointures.filter(p => p !== value) :
        [...this.articleForm.pointures, value];
    }
  }

  // Fonction pour gérer la sélection des photos
  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photo);
    }
    this.articleForm.photos = [...this.selectedPhotos];
  }

  update(): void {
    console.log('Article à mettre à jour:', this.articleForm);
    console.log('fournisseurEmail avant la mise à jour: ', this.articleForm.fournisseur.email );
  
    // Vérifier que fournisseurEmail est présent
    if (!this.articleForm.fournisseur.email ) {
      console.error('Erreur: fournisseurEmail est requis pour la mise à jour');
      return;
    }
  
    // Appel de la méthode update avec fournisseurEmail
    this.articleService.update(this.articleForm.id, this.articleForm, this.articleForm.fournisseur.email )
      .subscribe({
        next: (data) => {
          console.log('Article mis à jour avec succès', data);
          this.router.navigate(['/article']);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour de l\'article:', err);
        }
      });
  }
  

  redirectToArticles(): void {
    this.router.navigate(['/article']);
  }
}
