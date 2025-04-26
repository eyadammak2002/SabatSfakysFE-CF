import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { forkJoin } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ArticlePersonaliser, ArticlePersonaliserService } from '../article-personaliser.service';
import { Genre } from 'src/app/produit/Genre';

@Component({
  selector: 'app-create-article-personaliser',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-articlepersonaliser.component.html',
  styleUrls: ['./create-articlepersonaliser.component.css']
})
export class CreateArticlePersonaliserComponent {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];

  // Upload properties
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  uploadMessage: string = '';
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  newlyUploadedPhotos: Photo[] = [];
  // Dans votre composant
  photosToHide: number[] = []; // IDs des photos à masquer

  articleForm: ArticlePersonaliser = {
    id: 0,
    ref: '',
    name: '',
    description: '',
    genre: 'FEMME',
    tissu: 'CUIR',
    statut: 'EN_ATTENTE',
    category: { id: 0, name: '', description: '' },
    photos: [],
    client: {
      id: 0, // Valeur définie, même si elle peut être ignorée plus tard
      username: '',
      email: '',
      adresse: '',
      telephone: '',
      password: '', // tu peux mettre undefined ou laisser vide si optionnel
      sexe: Genre.FEMME // ✅ aussi avec l'énum
    }
  };
  

  constructor(
    private cdr: ChangeDetectorRef,
    private articlePersonaliserService: ArticlePersonaliserService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService,
    private tokenStorageService: TokenStorageService,
    private uploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
    this.getCategory();
    const user = this.tokenStorageService.getUser();
    if (user && user.email) {
      this.articleForm.client.email = user.email;
    } else {
      console.error('Aucun utilisateur connecté');
    }
  }

  // Helper method to check if a photo is selected (used in template)
  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotos.some(p => p.id === photoId);
  }

  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => {
        this.allPhoto = data;
        console.log('Photos récupérées:', this.allPhoto);
  
        // Si aucune photo n'a été nouvellement uploadée, récupérer tous les IDs des photos
        if (this.newlyUploadedPhotos.length === 0) {
          // Ajouter tous les IDs des photos de la base de données à photosToHide
          this.photosToHide = this.allPhoto.map(photo => photo.id);
          console.log('Tous les IDs des photos à masquer:', this.photosToHide);
        } else {
          // Mettre à jour la liste des photos sélectionnées après avoir uploadé des photos
        
          // Mettre à jour les photos dans le formulaire
          this.articleForm.photos = [...this.selectedPhotos];
          console.log('Photos sélectionnées après upload:', this.selectedPhotos);

          console.log('IDs des photos à masquer:', this.photosToHide);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des photos:', err);
      }
    });
  }
  
  getCategory(): void {
    this.categoryService.get().subscribe({
      next: (data) => (this.allCategory = data),
      error: (err) => console.error(err)
    });
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

  uploadPhotos(): void {
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
    this.newlyUploadedPhotos = [];
    
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const uploadObservables = Array.from(this.selectedFiles).map((file, index) => {
        return this.uploadFile(file, index);
      });

      // Utiliser forkJoin pour attendre que tous les fichiers soient téléchargés
      forkJoin(uploadObservables).subscribe({
        next: (responses) => {
          this.uploadSuccess = true;
          this.uploadMessage = 'Toutes les photos ont été téléchargées avec succès.';
          // Rafraîchir la liste des photos pour inclure les nouvelles
          this.getPhotos();
          this.selectedFiles = undefined;
          this.currentFiles = [];
        },
        error: (err) => {
          this.uploadError = true;
          this.uploadMessage = 'Une erreur est survenue lors du téléchargement de certaines photos.';
        }
      });
    }
  }

  // Modifiez la méthode uploadFile pour traiter correctement la réponse
  uploadFile(file: File, index: number): any {
    return new Promise((resolve, reject) => {
      this.uploadService.upload(file).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressInfos[index].value = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            // Stocker uniquement les données essentielles pour identifier la photo plus tard
            const newPhoto: Photo = event.body;
            this.newlyUploadedPhotos.push({...newPhoto}); // Utiliser une copie pour éviter les références partagées
            
            // Ne pas ajouter directement à selectedPhotos ici
            // Au lieu de cela, attendons getPhotos() pour le faire avec les données complètes
            
            console.log('Photo uploadée:', newPhoto);
            resolve(event.body);
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
    this.cdr.detectChanges(); // Use detectChanges instead of markForCheck for immediate update
    console.log('Selected Photos:', this.articleForm.photos);
  }

  onSubmit() {
    if (this.articleForm.ref && this.articleForm.name  ) {
      const emailClient = this.articleForm.client.email;
      
      this.articlePersonaliserService.createArticlePersonaliser(this.articleForm, emailClient).subscribe({
        next: (data) => {
          console.log('Article personnalisé créé avec succès', data);
          this.router.navigate(['/articlePersonaliser']);
        },
        error: (err) => console.error('Erreur lors de la création de l\'article personnalisé', err)
      });
    } else {
      console.error('Veuillez remplir tous les champs obligatoires');
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/articlePersonaliser']);
  }
}