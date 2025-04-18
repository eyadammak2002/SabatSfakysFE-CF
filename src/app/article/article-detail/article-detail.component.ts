import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { AvisService } from 'src/app/services/avis.service';
import { PanierService } from 'src/app/services/panier.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
declare var bootstrap: any;

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css']
})
export class ArticleDetailComponent implements OnInit {
  article: Article | null = null;
  articleId: number | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Pour le système de panier
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  selectedPointures: Pointure[] = [];
  
  // Pour les avis
  avis: any[] = [];
  isLoadingAvis: boolean = false;
  avisForm: FormGroup;
  avisModal: any;
  
  // Pour l'upload de photos d'avis
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  uploadMessage: string = '';
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  newlyUploadedPhotos: Photo[] = [];
  isUploading: boolean = false;
  
  // Nouvelles propriétés pour gérer l'affichage des photos
  allPhoto: Photo[] = [];
  photosToHide: number[] = [];
  
  // Pour l'authentification
  currentClientId: number | null = null;
  currentImageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private panierService: PanierService,
    private avisService: AvisService,
    private authService: AuthenticationService,
    private uploadService: FileUploadService,
    private photoService: PhotoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,  
    private tokenStorage: TokenStorageService
  ){
    // Initialisation du formulaire d'avis
    this.avisForm = this.fb.group({
      note: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID du client si l'utilisateur est connecté
    this.currentClientId = this.getCurrentClientId();
    console.log("currentClientId", this.currentClientId);
    
    // Charger toutes les photos disponibles
    this.getPhotos();
    
    // Récupérer l'id depuis l'URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.articleId = +id;
        this.loadArticleDetails(this.articleId);
        this.loadArticleAvis(this.articleId);
      } else {
        this.errorMessage = "Identifiant d'article non valide";
        this.isLoading = false;
      }
    });
  }
  
  // Méthode pour vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    const user = this.tokenStorage.getUser();
    return !!user && !!user.id;
  }
  
  // Récupérer l'ID du client connecté si disponible
  getCurrentClientId(): number | null {
    const user = this.tokenStorage.getUser();
    console.log("user", user);
    console.log("user id", user.id);
    return user?.id || null;
  }
  
  // Méthode pour vérifier si une photo est sélectionnée
  isPhotoSelected(photoId: number): boolean {
    return this.newlyUploadedPhotos.some(p => p.id === photoId);
  }
  
  // Récupérer toutes les photos depuis la base de données
  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => {
        this.allPhoto = data;
        console.log('Photos récupérées:', this.allPhoto);

        // Si aucune photo n'a été nouvellement uploadée, initialiser photosToHide
        if (this.newlyUploadedPhotos.length === 0) {
          this.photosToHide = this.allPhoto.map(photo => photo.id);
          console.log('Tous les IDs des photos à masquer:', this.photosToHide);
        } else {
          // Mettre à jour les photos dans l'avis avec les informations complètes
          // On pourrait filtrer les photos complètes ici si nécessaire
          console.log('Photos sélectionnées après upload:', this.newlyUploadedPhotos);
          console.log('IDs des photos à masquer:', this.photosToHide);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des photos:', err);
      }
    });
  }
 
  loadArticleDetails(id: number): void {
    this.isLoading = true;
    this.articleService.getById(id).subscribe({
      next: (data) => {
        this.article = data;
        this.isLoading = false;
        console.log("📝 Détails de l'article chargés:", this.article);
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement de l'article";
        this.isLoading = false;
        console.error("❌ Erreur:", err);
      }
    });
  }

  loadArticleAvis(articleId: number): void {
    this.isLoadingAvis = true;
    this.avisService.getAvisByArticleId(articleId).subscribe({
      next: (data) => {
        this.avis = data;
        this.isLoadingAvis = false;
        console.log("💬 Avis chargés:", this.avis);
        
        // Charger les informations utilisateur pour chaque avis si nécessaire
        this.avis.forEach(avis => {
          if (!avis.user || !avis.user.username) {
            this.loadUserForAvis(avis.id);
          }
        });
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des avis:", err);
        this.isLoadingAvis = false;
      }
    });
  }

  // Fonctions pour la gestion du panier
  selectCouleur(couleur: Couleur): void {
    this.selectedCouleur = couleur;
    
    if (this.article && this.article.stocks?.length) {
      this.selectedPointures = this.article.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      this.selectedPointure = null; // Réinitialiser la sélection
    } else {
      this.selectedPointures = [];
    }
  }

  getUniqueColors(stocks: any[]): Couleur[] {
    const couleursUniques = [...new Set(stocks.map(stock => stock.couleur.id))];
    return couleursUniques.map(id => stocks.find(stock => stock.couleur.id === id)?.couleur);
  }

  ajouterAuPanier(): void {
    if (!this.article) {
      return;
    }
    
    if (!this.selectedCouleur) {
      alert("Veuillez sélectionner une couleur !");
      return;
    }
    
    if (!this.selectedPointure) {
      alert("Veuillez sélectionner une pointure !");
      return;
    }
    
    this.panierService.ajouterAuPanier(this.article, this.selectedCouleur, this.selectedPointure);
    alert(`${this.article.name} ajouté au panier !`);
  }
  
  // Navigation entre les images
  nextImage(): void {
    if (this.article && this.article.photos && this.article.photos.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.article.photos.length;
    }
  }
  
  prevImage(): void {
    if (this.article && this.article.photos && this.article.photos.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.article.photos.length) % this.article.photos.length;
    }
  }
  
  // Retour à la liste des articles
  retourListe(): void {
    this.router.navigate(['/articles']);
  }
  
  // Méthodes d'upload de photos
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
    this.isUploading = true;
    
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const uploadObservables = Array.from(this.selectedFiles).map((file, index) => {
        return this.uploadFile(file, index);
      });

      // Utiliser forkJoin pour attendre que tous les fichiers soient téléchargés
      forkJoin(uploadObservables).subscribe({
        next: (responses) => {
          this.uploadSuccess = true;
          this.uploadMessage = 'Toutes les photos ont été téléchargées avec succès.';
          this.selectedFiles = undefined;
          this.currentFiles = [];
          
          // Récupérer les photos depuis la base de données comme dans CreateArticleComponent
          this.getPhotos();
          
          this.isUploading = false;
        },
        error: (err) => {
          this.uploadError = true;
          this.uploadMessage = 'Une erreur est survenue lors du téléchargement des photos.';
          this.isUploading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isUploading = false;
    }
  }

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
  
  // Fonctions pour le système d'avis
  ouvrirFormAvis(): void {
    if (!this.isLoggedIn()) {
      // Rediriger vers la page de connexion
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/detailArticle/${this.articleId}` } 
      });
      return;
    }
    
    // Réinitialiser le formulaire
    this.avisForm.reset();
    this.newlyUploadedPhotos = [];
    
    // Ouvrir le modal
    const modalElement = document.getElementById('avisModal');
    if (modalElement) {
      this.avisModal = new bootstrap.Modal(modalElement);
      this.avisModal.show();
    }
  }
  
  soumettreAvis(): void {
    // Récupérer à nouveau l'ID du client au cas où
    const currentUserId = this.getCurrentClientId();
    console.log("currentUserId", currentUserId);
    
    if (this.avisForm.invalid || !this.articleId || !currentUserId) {
      return;
    }
    
    // Vérifier et logger les photos avant soumission
    console.log("Photos disponibles pour l'avis:", this.newlyUploadedPhotos);
    
    // Créer l'objet avis avec des copies des photos pour éviter les problèmes de référence
    const avisData = {
      description: this.avisForm.value.description,
      note: this.avisForm.value.note,
      photos: [...this.newlyUploadedPhotos]
    };
    
    console.log("Données d'avis à soumettre:", avisData);
    
    // Soumettre l'avis
    this.avisService.createAvis(avisData, currentUserId, this.articleId).subscribe({
      next: (response) => {
        console.log('Avis créé avec succès:', response);
        
        // Fermer le modal
        if (this.avisModal) {
          this.avisModal.hide();
        }
        
        // Recharger les avis
        this.loadArticleAvis(this.articleId!);
        
        // Afficher un message de succès
        alert('Votre avis a été publié avec succès !');
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'avis:', err);
        alert('Erreur lors de la publication de votre avis. Veuillez réessayer.');
      }
    });
  }
  
  // Vérifier si l'utilisateur est l'auteur d'un avis
  isAvisAuthor(avisItem: any): boolean {
    return this.isLoggedIn() && this.currentClientId === avisItem.client?.id;
  }
  
  // Supprimer un avis
  supprimerAvis(avisId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      this.avisService.deleteAvis(avisId).subscribe({
        next: () => {
          this.loadArticleAvis(this.articleId!);
          alert('Avis supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'avis:', err);
          alert('Erreur lors de la suppression de l\'avis. Veuillez réessayer.');
        }
      });
    }
  }
  
  togglePhotoSelection(photo: Photo): void {
    const index = this.newlyUploadedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      // Si la photo est déjà sélectionnée, la retirer
      this.newlyUploadedPhotos.splice(index, 1);
    } else {
      // Sinon, l'ajouter à la sélection
      this.newlyUploadedPhotos.push(photo);
    }
    this.cdr.detectChanges(); // Forcer la mise à jour de l'affichage
    console.log('Photos sélectionnées pour l\'avis:', this.newlyUploadedPhotos);
  }
  
  // Supprimer une photo uploadée
  supprimerPhotoUploadee(index: number): void {
    this.newlyUploadedPhotos.splice(index, 1);
    this.cdr.detectChanges();
  }

  // Dans ArticleDetailComponent

// Ajouter une méthode pour récupérer les infos utilisateur pour un avis spécifique
loadUserForAvis(avisId: number): void {
  this.avisService.getUserFromAvis(avisId).subscribe({
    next: (userData) => {
      // Trouver l'avis dans le tableau et mettre à jour les informations utilisateur
      const avisIndex = this.avis.findIndex(a => a.id === avisId);
      if (avisIndex !== -1) {
        this.avis[avisIndex].user = userData;
        this.cdr.detectChanges();
      }
      console.log(`Informations utilisateur chargées pour l'avis ${avisId}:`, userData);
    },
    error: (err) => {
      console.error(`Erreur lors du chargement des informations utilisateur pour l'avis ${avisId}:`, err);
    }
  });
}
}