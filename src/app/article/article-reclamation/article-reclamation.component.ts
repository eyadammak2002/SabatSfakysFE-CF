import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { ReclamationService } from 'src/app/services/reclamation.service';
import { PanierService } from 'src/app/services/panier.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Article, Couleur, Pointure } from '../article';
import { ArticleService } from '../article.service';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { CommonModule } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-article-reclamation',
  templateUrl: './article-reclamation.component.html',
  styleUrls: ['./article-reclamation.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ArticleReclamationComponent implements OnInit {
  article: Article | null = null;
  articleId: number | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Pour le système de panier
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  selectedPointures: Pointure[] = [];
  
  // Pour les reclamation
  reclamation: any[] = [];
  isLoadingReclamation: boolean = false;
  reclamationForm: FormGroup;
  reclamationModal: any;
  
  // Pour l'upload de photos d'reclamation
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

  userPeutReclamer: boolean = false;
  verificationAchatEnCours: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private panierService: PanierService,
    private reclamationService: ReclamationService,
    private authService: AuthenticationService,
    private uploadService: FileUploadService,
    private photoService: PhotoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,  
    private tokenStorage: TokenStorageService
  ){
    // Initialisation du formulaire d'reclamation
    this.reclamationForm = this.fb.group({
      /*note: ['', Validators.required],*/
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID du client de manière asynchrone
    this.getCurrentClientId().then(clientId => {
      this.currentClientId = clientId;
      console.log("currentClientId récupéré:", this.currentClientId);
      
      // Charger toutes les photos disponibles
      this.getPhotos();
      
      // Récupérer l'id depuis l'URL
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.articleId = +id;
          this.loadArticleDetails(this.articleId);
          this.loadArticleReclamation(this.articleId);
          
          // Vérifier si l'utilisateur peut faire une réclamation
          if (this.currentClientId) {
            this.verifierSiPeutReclamer();
          }
        } else {
          this.errorMessage = "Identifiant d'article non valide";
          this.isLoading = false;
        }
      });
      
      // Vérifier également les paramètres de requête pour clientId 
      this.route.queryParamMap.subscribe(queryParams => {
        const clientIdFromUrl = queryParams.get('clientId');
        if (clientIdFromUrl && !isNaN(Number(clientIdFromUrl))) {
          // Si présent dans l'URL, mettre à jour la valeur
          this.currentClientId = Number(clientIdFromUrl);
          console.log("ID client récupéré depuis l'URL:", this.currentClientId);
        }
      });
    });
  }
// Ajouter la méthode verifierSiPeutReclamer
verifierSiPeutReclamer(): void {
  if (!this.currentClientId || !this.articleId) {
    console.log("Impossible de vérifier: ID client ou article manquant");
    return;
  }
  
  // S'assurer que clientId est un nombre
  const clientIdNum = Number(this.currentClientId);
  if (isNaN(clientIdNum)) {
    console.error("L'ID client n'est pas un nombre valide:", this.currentClientId);
    return;
  }
  
  this.verificationAchatEnCours = true;
  this.reclamationService.verifierAchatArticle(clientIdNum, this.articleId).subscribe({
    next: (peutReclamer) => {
      this.userPeutReclamer = peutReclamer;
      this.verificationAchatEnCours = false;
      console.log(`L'utilisateur ${peutReclamer ? 'peut' : 'ne peut pas'} faire une réclamation sur cet article`);
    },
    error: (err) => {
      console.error("Erreur lors de la vérification d'achat:", err);
      this.userPeutReclamer = false;
      this.verificationAchatEnCours = false;
    }
  });
}
  
  
  // Méthode pour vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    const user = this.tokenStorage.getUser();
    return !!user && !!user.id;
  }
  
  // Récupérer l'ID du client connecté si disponible
  getCurrentClientId(): Promise<number | null> {
    const user = this.tokenStorage.getUser();
    
    // Vérifier si l'utilisateur est connecté
    if (!user || !user.email) {
      console.log("Aucun utilisateur connecté");
      return Promise.resolve(null);
    }
    
    const email = user.email;
    console.log("Recherche du client pour l'email:", email);
    
    // Vérifier si l'ID est déjà disponible dans le token et s'il est un nombre
    if (user.clientId && !isNaN(Number(user.clientId))) {
      const clientIdNum = Number(user.clientId);
      console.log("ID client trouvé dans le token:", clientIdNum);
      return Promise.resolve(clientIdNum);
    }
    
    // Sinon faire l'appel API pour récupérer l'ID client
    return this.reclamationService.getClientIdByEmail(email).toPromise()
      .then(clientId => {
        if (clientId !== null && clientId !== undefined) {
          // S'assurer que c'est un nombre
          const clientIdNum = Number(clientId);
          if (!isNaN(clientIdNum)) {
            console.log("Client ID obtenu depuis l'API:", clientIdNum);
            // Stocker l'ID dans le localStorage pour éviter de refaire l'appel
            const currentUser = this.tokenStorage.getUser();
            currentUser.clientId = clientIdNum;
            this.tokenStorage.saveUser(currentUser);
            return clientIdNum;
          } else {
            console.error("L'API a renvoyé un ID client qui n'est pas un nombre:", clientId);
            return null;
          }
        } else {
          console.warn("L'API a renvoyé un ID client null ou undefined");
          return null;
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération du client ID:", error);
        // Si on a une erreur 404, c'est probablement que l'utilisateur est connecté
        // mais n'est pas enregistré comme client
        if (error.status === 404) {
          console.warn("Utilisateur connecté mais non enregistré comme client");
          alert("Votre compte utilisateur n'est pas associé à un profil client. Veuillez compléter votre profil.");
        }
        return null;
      });
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
          // Mettre à jour les photos dans l'reclamation avec les informations complètes
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

  loadArticleReclamation(articleId: number): void {
    this.isLoadingReclamation = true;
    this.reclamationService.getReclamationByArticleId(articleId).subscribe({
      next: (data) => {
        this.reclamation = data;
        this.isLoadingReclamation = false;
        console.log("💬 Reclamation chargés:", this.reclamation);
        
        // Charger les informations utilisateur pour chaque reclamation si nécessaire
        this.reclamation.forEach(reclamation => {
          if (!reclamation.user || !reclamation.user.username) {
            this.loadUserForReclamation(reclamation.id);
          }
        });
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des reclamation:", err);
        this.isLoadingReclamation = false;
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
  
  // Fonctions pour le système d'reclamation
  ouvrirFormReclamation(): void {
    if (!this.isLoggedIn()) {
      // Rediriger vers la page de connexion
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/articleReclamation/${this.articleId}` } 
      });
      return;
    }
    
    // Réinitialiser le formulaire
    this.reclamationForm.reset();
    this.newlyUploadedPhotos = [];
    
    // Ouvrir le modal
    const modalElement = document.getElementById('reclamationModal');
    if (modalElement) {
      this.reclamationModal = new bootstrap.Modal(modalElement);
      this.reclamationModal.show();
    }
  }
  
  soumettreReclamation(): void {
    console.log("Fonction soumettreReclamation appelée");
  
    if (this.reclamationForm.invalid || !this.articleId) {
      console.error("Formulaire invalide ou articleId manquant");
      return;
    }
    
    // Obtenir l'ID client de manière asynchrone
    this.getCurrentClientId().then(clientId => {
      if (!clientId) {
        console.error("Impossible d'obtenir l'ID client");
        alert("Une erreur est survenue. Impossible de vous identifier comme client.");
        return;
      }
      
      // S'assurer que clientId est un nombre
      const clientIdNum = Number(clientId);
      if (isNaN(clientIdNum)) {
        console.error("L'ID client n'est pas un nombre valide:", clientId);
        alert("Une erreur est survenue. Identifiant client invalide.");
        return;
      }
      
      // Vérifier et logger les photos avant soumission
      console.log("Photos disponibles pour la réclamation:", this.newlyUploadedPhotos);
      
      // Créer l'objet réclamation avec des copies des photos pour éviter les problèmes de référence
      const reclamationData = {
        description: this.reclamationForm.value.description,
        photos: [...this.newlyUploadedPhotos]
      };
      
      console.log("Données de réclamation à soumettre:", reclamationData);
      console.log("Client ID pour la réclamation:", clientIdNum);
      console.log("Article ID pour la réclamation:", this.articleId);
      
      // Soumettre la réclamation avec l'ID client numérique
      this.reclamationService.createReclamation(reclamationData, clientIdNum, this.articleId!).subscribe({
        next: (response) => {
          console.log('Réclamation créée avec succès:', response);
          
         
          
          // Afficher un message de succès
          alert('Votre réclamation a été publiée avec succès !');
          this.router.navigate(['/mes-reclamations']);
        },
        error: (err) => {
          console.error('Erreur lors de la création de la réclamation:', err);
          alert('Erreur lors de la publication de votre réclamation. Veuillez réessayer.');
        }
      });
    }).catch(error => {
      console.error("Erreur lors de la récupération de l'ID client:", error);
      alert("Une erreur est survenue lors de la récupération de vos informations.");
    });
  }


  // Vérifier si l'utilisateur est l'auteur d'un reclamation
  isReclamationAuthor(reclamationItem: any): boolean {
    return this.isLoggedIn() && this.currentClientId === reclamationItem.client?.id;
  }
  
  
  // Supprimer un reclamation
  supprimerReclamation(reclamationId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet reclamation ?')) {
      this.reclamationService.deleteReclamation(reclamationId).subscribe({
        next: () => {
          this.loadArticleReclamation(this.articleId!);
          alert('Reclamation supprimé avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'reclamation:', err);
          alert('Erreur lors de la suppression de l\'reclamation. Veuillez réessayer.');
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
    console.log('Photos sélectionnées pour l\'reclamation:', this.newlyUploadedPhotos);
  }
  
  // Supprimer une photo uploadée
  supprimerPhotoUploadee(index: number): void {
    this.newlyUploadedPhotos.splice(index, 1);
    this.cdr.detectChanges();
  }

  // Dans ArticleDetailComponent

// Ajouter une méthode pour récupérer les infos utilisateur pour un reclamation spécifique
loadUserForReclamation(reclamationId: number): void {
  this.reclamationService.getUserFromReclamation(reclamationId).subscribe({
    next: (userData) => {
      // Trouver l'reclamation dans le tableau et mettre à jour les informations utilisateur
      const reclamationIndex = this.reclamation.findIndex(a => a.id === reclamationId);
      if (reclamationIndex !== -1) {
        this.reclamation[reclamationIndex].user = userData;
        this.cdr.detectChanges();
      }
      console.log(`Informations utilisateur chargées pour l'reclamation ${reclamationId}:`, userData);
    },
    error: (err) => {
      console.error(`Erreur lors du chargement des informations utilisateur pour l'reclamation ${reclamationId}:`, err);
    }
  });
}




}