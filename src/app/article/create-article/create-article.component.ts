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
import { forkJoin } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';

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
  allPhoto: Photo[] = []; // Contiendra uniquement les photos liées à cet article
  couleursDisponibles: Couleur[] = [];
  pointuresDisponibles: Pointure[] = [];
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  quantite: number = 0;

  // Upload properties
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  uploadMessage: string = '';
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  isUploading: boolean = false;
  
  // Article temporaire ID (pour la création)
  tempArticleId: number = -1;

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
    private tokenStorageService: TokenStorageService,
    private uploadService: FileUploadService
  ) {
    // Pour debug des redirections
    this.router.events.subscribe(event => {
      console.log('Router event:', event);
    });
  }

  ngOnInit(): void {
    this.getCouleurs();
    this.getPointures();
    this.getCategory();
    
    // Initialiser les photos vides pour l'article en cours
    this.allPhoto = [];
    this.selectedPhotos = [];
    
    const user = this.tokenStorageService.getUser();
    if (user && user.email) {
      this.articleForm.fournisseur.email = user.email;
    } else {
      console.error('Aucun utilisateur connecté');
    }
  }

  // Helper method to check if a photo is selected (used in template)
  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotos.some(p => p.id === photoId);
  }

  calculerPrixVente() {
    if (this.articleForm.prixFournisseur) {
      // Calcul du prix de vente avec une majoration de 10%
      this.articleForm.prixVente = +(this.articleForm.prixFournisseur * 1.1).toFixed(2);
    } else {
      this.articleForm.prixVente = 0;
    }
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

  // File upload methods
  selectFiles(event: any): void {
    this.selectedFiles = event.target.files;
    this.currentFiles = Array.from(this.selectedFiles || []);
    this.progressInfos = this.currentFiles.map(file => ({ value: 0, fileName: file.name }));
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
  }

  uploadPhotos(event?: Event): void {
    // Empêcher la soumission du formulaire si un événement est passé
    if (event) {
      event.preventDefault();
    }
    
    // Si un upload est déjà en cours, ne rien faire
    if (this.isUploading) {
      console.log('Upload déjà en cours, ignoré');
      return;
    }
    
    console.log('Début de l\'upload des photos');
    
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
    
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      this.isUploading = true;
      
      // Créer un article temporaire pour l'upload si nécessaire
      this.createTempArticle().then(articleId => {
        console.log('Article temporaire créé avec ID:', articleId);
        
        const uploadObservables = Array.from(this.selectedFiles!).map((file, index) => {
          return this.uploadFile(file, index, articleId);
        });
    
        // Utiliser forkJoin pour attendre que tous les fichiers soient téléchargés
        forkJoin(uploadObservables).subscribe({
          next: (responses) => {
            this.uploadSuccess = true;
            this.uploadMessage = 'Toutes les photos ont été téléchargées avec succès.';
            this.selectedFiles = undefined;
            this.currentFiles = [];
            this.isUploading = false;
            
            console.log('Upload terminé avec succès, PAS de redirection');
          },
          error: (err) => {
            this.uploadError = true;
            this.uploadMessage = 'Une erreur est survenue lors du téléchargement de certaines photos.';
            console.error('Erreur upload:', err);
            this.isUploading = false;
          },
          complete: () => {
            console.log('Upload observable complété');
            this.isUploading = false;
          }
        });
      }).catch(error => {
        console.error('Erreur lors de la création de l\'article temporaire:', error);
        this.uploadError = true;
        this.uploadMessage = 'Erreur: Impossible de préparer l\'upload';
        this.isUploading = false;
      });
    }
  }

  // Function to fix the issue in CreateArticleComponent
private createTempArticle(): Promise<number> {
  return new Promise((resolve, reject) => {
    // If we already have a temp ID, use it
    if (this.tempArticleId > 0) {
      resolve(this.tempArticleId);
      return;
    }
    
    // Instead of uploading the first file here, just resolve with -1
    // We'll handle all uploads in uploadFile
    resolve(-1);
  });
}

// Modified uploadFile method
uploadFile(file: File, index: number, articleId: number): any {
  return new Promise((resolve, reject) => {
    // Skip if already uploading
    if (this.progressInfos[index].value > 0) {
      console.log(`Fichier ${file.name} déjà en cours d'upload, ignoré`);
      resolve(null);
      return;
    }

    // Just use uploadService.upload for all files in CreateArticleComponent
    this.uploadService.upload(file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progressInfos[index].value = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          // Create new photo from response
          const newPhoto: Photo = {
            id: event.body.id || 0, // Use the ID from the response if available
            name: event.body.fileName,
            url: event.body.fileDownloadUri
          };
          
          // Add to photo lists and mark that this is already uploaded
          // by setting a flag or using the proper ID
          this.allPhoto.push(newPhoto);
          this.selectedPhotos.push(newPhoto);
          this.articleForm.photos = [...this.selectedPhotos];
          
          this.cdr.detectChanges();
          resolve(newPhoto);
        }
      },
      error: (err: any) => {
        this.progressInfos[index].value = 0;
        this.uploadError = true;
        reject(err);
      }
    });
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
    this.cdr.detectChanges();
    console.log('Selected Photos:', this.articleForm.photos);
  }

  onSubmit() {
    console.log('Début de soumission du formulaire d\'article');
    
    if (this.articleForm.ref && this.articleForm.name && this.articleForm.prixFournisseur && this.articleForm.photos.length > 0 && this.articleStocks.length > 0) {
      this.articleForm.stocks = [...this.articleStocks];
      
      const emailFournisseur = this.articleForm.fournisseur.email;
      
      this.articleService.create(this.articleForm, emailFournisseur).subscribe({
        next: (data) => {
          console.log('Article créé avec succès', data);
          this.router.navigate(['/articles']);
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'article', err);
          alert('Erreur lors de la création de l\'article');
        }
      });
    } else {
      console.error('Formulaire invalide. Vérifiez que tous les champs sont remplis:');
      console.log('Ref:', this.articleForm.ref);
      console.log('Name:', this.articleForm.name);
      console.log('Prix fournisseur:', this.articleForm.prixFournisseur);
      console.log('Photos:', this.articleForm.photos.length);
      console.log('Stocks:', this.articleStocks.length);
      
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/articles']);
  }
  
  // Méthode pour supprimer une photo de la liste
  deletePhoto(photo: any): void {
    console.log('Suppression de la photo de la sélection:', photo);
    
    // Ne supprimer que de nos listes, pas de la base de données
    this.allPhoto = this.allPhoto.filter(p => p.id !== photo.id);
    this.selectedPhotos = this.selectedPhotos.filter(p => p.id !== photo.id);
    this.articleForm.photos = [...this.selectedPhotos];
    
    this.cdr.detectChanges();
  }
}