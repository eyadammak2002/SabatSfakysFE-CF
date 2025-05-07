import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { AvisService } from 'src/app/services/avis.service';
import { PanierService } from 'src/app/services/panier.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { AuthenticationService } from 'src/app/services/Authentication.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { StockService } from 'src/app/panier/stock.service';
import { Article, Couleur, Pointure } from 'src/app/article/article';
import { ArticleService } from 'src/app/article/article.service';
declare var bootstrap: any;

@Component({
  selector: 'app-detail-article-avis',
  templateUrl: './detail-article-avis.component.html',
  styleUrls: ['./detail-article-avis.component.css']
})
export class DetailArticleAvisComponent implements OnInit {
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
  isFavori = false;
  favorisCount = 0;
  
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

  userPeutDonnerAvis: boolean = false;
  verificationAchatEnCours: boolean = false;

  userPeutReclamer: boolean = false;

  pointureOutOfStock: { [id: number]: boolean } = {};
  stockDisponible: number | null = null;
  stockInsuffisant: boolean = false;

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
    private tokenStorage: TokenStorageService,
    private favorisService:FavorisService,
    private stockService: StockService 

  ){
    // Initialisation du formulaire d'avis
    this.avisForm = this.fb.group({
      note: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.getCurrentClientId().then(clientId => {
      this.currentClientId = clientId;
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
  
          if (this.isLoggedIn() && this.currentClientId) {
            this.verifierSiPeutDonnerAvis();
            this.verifierSiPeutReclamer();

          }
        } else {
          this.errorMessage = "Identifiant d'article non valide";
          this.isLoading = false;
        }
      });
    });
  }
  verifierSiPeutReclamer(): void {
    const userId = this.getCurrentUserId();
    
    if (!userId || !this.articleId) return;
    
    this.verificationAchatEnCours = true;
    this.avisService.verifierAchatArticle(userId, this.articleId).subscribe({
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
  
   // Ajout de la nouvelle méthode pour vérifier le stock de toutes les pointures
   checkStockForAllSizes(): void {
    if (!this.article || !this.selectedCouleur || this.selectedPointures.length === 0) {
      return;
    }
    
    // Créer un tableau de requêtes pour vérifier le stock de chaque pointure
    const stockRequests = this.selectedPointures.map(pointure => 
      this.stockService.getStockQuantity(
        this.article!.id,
        this.selectedCouleur!.id,
        pointure.id
      ).pipe(
        catchError(err => {
          console.error(`Erreur lors de la vérification du stock pour la pointure ${pointure.taille}:`, err);
          return of(0); // En cas d'erreur, considérer que le stock est 0
        })
      )
    );
    
    // Exécuter toutes les requêtes en parallèle
    forkJoin(stockRequests).subscribe(results => {
      // Mettre à jour le statut de stock pour chaque pointure
      this.selectedPointures.forEach((pointure, index) => {
        const stockQuantity = results[index];
        this.pointureOutOfStock[pointure.id] = stockQuantity <= 0;
      });
      
      console.log("Statut du stock des pointures:", this.pointureOutOfStock);
      this.cdr.detectChanges(); // Assurez-vous que l'UI est mise à jour
    });
  }
  
  // Récupérer l'ID du client connecté si disponible
  getCurrentUserId(): number | null {
    const user = this.tokenStorage.getUser();
    const email=user.email;
    
    console.log("user", user);
    console.log("user id", user?.id);
    return user?.id || null;
  }

  // Version corrigée de getCurrentClientId dans article-detail.component.ts
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
  return this.avisService.getClientIdByEmail(email).toPromise()
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

        if (this.article && this.article.id) {
          this.checkFavori(this.article.id);
          this.getFavorisCount(this.article.id);
        }
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

  

  getUniqueColors(stocks: any[]): Couleur[] {
    const couleursUniques = [...new Set(stocks.map(stock => stock.couleur.id))];
    return couleursUniques.map(id => stocks.find(stock => stock.couleur.id === id)?.couleur);
  }

  // Modification de la méthode selectCouleur pour inclure la vérification de stock
  selectCouleur(couleur: Couleur): void {
    this.selectedCouleur = couleur;
    this.stockInsuffisant = false;
    this.selectedPointure = null;
    this.pointureOutOfStock = {}; // Réinitialiser le statut de stock des pointures
    
    if (this.article && this.article.stocks?.length) {
      this.selectedPointures = this.article.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      // Vérifier le stock pour chaque pointure
      this.checkStockForAllSizes();
    } else {
      this.selectedPointures = [];
    }
  }

  // Modification de la méthode pour sélectionner une pointure
  selectPointure(pointure: Pointure): void {
    // Ne rien faire si la pointure est en rupture de stock
    if (this.pointureOutOfStock[pointure.id]) {
      return;
    }
    
    this.selectedPointure = pointure;
    this.stockInsuffisant = false;
    
    // Vérifier le stock disponible pour la combinaison article/couleur/pointure
    if (this.article && this.selectedCouleur) {
      this.stockService.getStockQuantity(
        this.article.id,
        this.selectedCouleur.id,
        pointure.id
      ).subscribe({
        next: (quantite) => {
          this.stockDisponible = quantite;
          console.log(`Stock disponible: ${quantite} unités`);
          
          // Marquer comme indisponible si le stock est ≤ 0
          if (quantite <= 0) {
            this.stockInsuffisant = true;
            this.pointureOutOfStock[pointure.id] = true;
          }
        },
        error: (err) => {
          console.error("Erreur lors de la vérification du stock:", err);
          this.stockInsuffisant = true;
          this.pointureOutOfStock[pointure.id] = true;
        }
      });
    }
  }

  // Modification de la méthode ajouterAuPanier pour vérifier le stock
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
    
    // Vérification du stock
    if (this.stockInsuffisant || this.pointureOutOfStock[this.selectedPointure.id]) {
      alert("Stock insuffisant pour cet article dans la couleur et pointure sélectionnées!");
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
    this.router.navigate(['/fournisseur/listAvis']);
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
  
  gererClicAvis(): void {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!this.isLoggedIn()) {
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: `/detailArticle/${this.articleId}` } 
      });
      return;
    }
    
    // Si l'état de vérification n'est pas encore connu, ou si une vérification est en cours
    if (this.verificationAchatEnCours) {
      alert("Vérification en cours, veuillez patienter...");
      return;
    }
    
    // Si on n'a pas encore vérifié l'achat, le faire maintenant et attendre le résultat
    if (this.userPeutDonnerAvis === false && !this.verificationAchatEnCours) {
      const userId = this.getCurrentUserId();
      if (!userId || !this.articleId) return;
      
      this.verificationAchatEnCours = true;
      
      // Important: effectuer la vérification de manière asynchrone et attendre le résultat
      this.avisService.verifierAchatArticle(userId, this.articleId).subscribe({
        next: (peutDonnerAvis) => {
          this.userPeutDonnerAvis = peutDonnerAvis;
          this.verificationAchatEnCours = false;
          
          // Maintenant que nous avons le résultat, décider quoi faire
          if (this.userPeutDonnerAvis) {
            // Si l'utilisateur peut donner un avis, ouvrir le modal
            this.ouvrirModalAvis();
          } else {
            // Sinon, afficher le message d'erreur
            alert("Vous devez avoir acheté cet article pour laisser un avis.");
          }
        },
        error: (err) => {
          console.error("Erreur lors de la vérification d'achat:", err);
          this.userPeutDonnerAvis = false;
          this.verificationAchatEnCours = false;
          alert("Une erreur est survenue lors de la vérification de votre achat.");
        }
      });
      return;
    }
    
    // Si l'utilisateur a déjà été vérifié et peut donner un avis, ouvrir le modal
    if (this.userPeutDonnerAvis) {
      this.ouvrirModalAvis();
    } else {
      // Si l'utilisateur a déjà été vérifié et ne peut pas donner un avis, afficher le message
      alert("Vous devez avoir acheté cet article pour laisser un avis.");
    }
  }


  // Méthode pour ouvrir le modal d'avis
  ouvrirModalAvis(): void {
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
  
  // Conserver la méthode originale pour la compatibilité
  ouvrirFormAvis(): void {
    this.gererClicAvis();
  }
  
  verifierSiPeutDonnerAvis(): void {
    // Utilisez getCurrentUserId() au lieu de currentClientId
    const userId = this.getCurrentUserId();
    
    if (!userId || !this.articleId) return;
    
    this.verificationAchatEnCours = true;
    this.avisService.verifierAchatArticle(userId, this.articleId).subscribe({
      next: (peutDonnerAvis) => {
        this.userPeutDonnerAvis = peutDonnerAvis;
        this.verificationAchatEnCours = false;
        console.log(`L'utilisateur ${peutDonnerAvis ? 'peut' : 'ne peut pas'} donner un avis sur cet article`);
      },
      error: (err) => {
        console.error("Erreur lors de la vérification d'achat:", err);
        this.userPeutDonnerAvis = false;
        this.verificationAchatEnCours = false;
      }
    });
  }
  // Modification de la méthode soumettreAvis dans article-detail.component.ts
soumettreAvis(): void {
  if (this.avisForm.invalid || !this.articleId) {
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
    console.log("Photos disponibles pour l'avis:", this.newlyUploadedPhotos);
    
    // Créer l'objet avis avec des copies des photos pour éviter les problèmes de référence
    const avisData = {
      description: this.avisForm.value.description,
      note: this.avisForm.value.note,
      photos: [...this.newlyUploadedPhotos]
    };
    
    console.log("Données d'avis à soumettre:", avisData);
    
    // Soumettre l'avis avec l'ID client obtenu (comme nombre)
    this.avisService.createAvis(avisData, clientIdNum, this.articleId!).subscribe({
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
  }).catch(error => {
    console.error("Erreur lors de la récupération de l'ID client:", error);
    alert("Une erreur est survenue lors de la récupération de vos informations.");
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


  checkFavori(articleId: number): void {
    this.favorisService.isFavori(articleId).subscribe(
      isFavori => {
        this.isFavori = isFavori;
      }
    );
  }

  getFavorisCount(articleId: number): void {
    this.favorisService.getArticleFavorisCount(articleId).subscribe(
      count => {
        this.favorisCount = count;
      }
    );
  }

  
  toggleFavori(): void {
    if (!this.isLoggedIn()) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: `/detailArticle/${this.articleId}` } 
      });
      return;
    }
    
    if (this.article) {
      this.favorisService.toggleFavori(this.article.id).subscribe({
        next: (response) => {
          // Vérifier si une erreur a été retournée
          if (response && response.error) {
            console.error('Erreur:', response.error);
            alert(response.error);
            return;
          }
          
          this.isFavori = !this.isFavori;
          // Mettre à jour le compteur
          this.favorisCount = this.isFavori ? this.favorisCount + 1 : this.favorisCount - 1;
        },
        error: (err) => {
          console.error('Erreur lors de la modification des favoris:', err);
          alert('Une erreur est survenue. Veuillez réessayer.');
        }
      });
    }
  }

  allerReclamation(): void {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!this.isLoggedIn()) {
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: `/articlereclamation/${this.articleId}` } 
      });
      return;
    }
    
    // Vérifier si l'utilisateur peut faire une réclamation
    if (this.verificationAchatEnCours) {
      alert("Vérification en cours, veuillez patienter...");
      return;
    }
    
    // Si l'achat a déjà été vérifié et l'utilisateur peut réclamer
    if (this.userPeutReclamer) {
      this.ouvrirFormReclamation();
      return;
    }
    
    // Sinon, vérifier l'achat
    this.verificationAchatEnCours = true;
    
    // Attendre que la promesse soit résolue
    this.getCurrentClientId()
      .then(clientId => {
        if (!clientId || !this.articleId) {
          this.verificationAchatEnCours = false;
          alert("Impossible d'obtenir vos informations client.");
          return;
        }
        
        console.log("Client ID récupéré pour la vérification:", clientId);
        
        // Passer le clientId numérique, pas l'objet entier
        this.avisService.verifierAchatArticle(clientId, this.articleId).subscribe({
          next: (peutReclamer) => {
            this.userPeutReclamer = peutReclamer;
            this.verificationAchatEnCours = false;
            
            if (this.userPeutReclamer) {
              this.ouvrirFormReclamation();
            } else {
              alert("Vous devez avoir acheté cet article pour faire une réclamation.");
            }
          },
          error: (err) => {
            console.error("Erreur lors de la vérification d'achat:", err);
            this.userPeutReclamer = false;
            this.verificationAchatEnCours = false;
            alert("Une erreur est survenue lors de la vérification de votre achat.");
          }
        });
      })
      .catch(error => {
        console.error("Erreur lors de la récupération de l'ID client:", error);
        this.verificationAchatEnCours = false;
        alert("Une erreur est survenue lors de la récupération de vos informations.");
      });
  }

  ouvrirFormReclamation(): void {
    // Naviguer vers la page de réclamation avec l'ID de l'article
    this.router.navigate([`/articlereclamation/${this.articleId}`]);
  }

}