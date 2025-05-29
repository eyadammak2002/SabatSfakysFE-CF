import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { catchError, forkJoin, of } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ArticlePersonaliser, ArticlePersonaliserService } from '../article-personaliser.service';
import { Genre } from 'src/app/produit/Genre';
import { Fournisseur } from 'src/app/pack/Fournisseur';
import { animate, style, transition, trigger } from '@angular/animations';
import { ArticleService } from 'src/app/article/article.service';
import { StockService } from 'src/app/panier/stock.service';
import { FavorisService } from 'src/app/services/favoris.service';
import { PanierService } from 'src/app/services/panier.service';
import { Article, Couleur, Pointure } from 'src/app/article/article';

@Component({
  selector: 'app-create-article-personaliser',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-articlePersonaliser.component.html',
  styleUrls: ['./create-articlePersonaliser.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class CreateArticlePersonaliserComponent {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];
  fournisseurs: Fournisseur[] = []; // Liste des fournisseurs disponibles

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


  currentStep: number = 1;
  stepFormSubmitted: boolean = false;
  stepErrors: { [key: number]: boolean } = {};
  
  // Suivi des étapes complétées
  stepCompleted: { [key: number]: boolean } = {
    1: false,
    2: false,
    3: false,
    4: false
  };


  
  articleForm: ArticlePersonaliser = {
    id: 0,
    couleur: '',
    pointure: 0,
    formePied: '',
    typeSemelle: '',
    typePied: '',
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
    },
    fournisseur: {
      id: 0,
      nom: '',
      email: '',
      adresse: '',
      telephone: '',
      motDePasse: '',
      statut: 'EN_ATTENTE',
      logo: { id: 0, name: '', url: '' } // selon ton modèle Photo
    }
  };
  
  // ID du fournisseur sélectionné (pour l'API)
  selectedFournisseurId: number = 0;



  // NOUVELLES PROPRIÉTÉS À AJOUTER :
  selectedFournisseur: Fournisseur | null = null;
  articlesDuFournisseur: Article[] = [];
  showFournisseurModal: boolean = false;
  showFournisseurDetails: boolean = false; // Pour affichage en dessous
  
  // Propriétés pour les favoris (copiées de listFournisseur)
  favorisIds: number[] = [];
  favoritesStatus: { [articleId: number]: boolean } = {};
  
  // Propriétés pour le panier (copiées de listFournisseur)
  selectedArticle: Article | null = null;
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  selectedPointures: Pointure[] = [];
  stockInsuffisant: boolean = false;
  pointureOutOfStock: { [id: number]: boolean } = {};
  activePhotoIndex: number = 0;
  selectedStockInfo: number | null = null;
  
  // Propriétés pour le carousel
  activeIndexes: { [key: number]: number } = {};

  
  constructor(
    private cdr: ChangeDetectorRef,
    private articlePersonaliserService: ArticlePersonaliserService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService,
    private tokenStorageService: TokenStorageService,
    private uploadService: FileUploadService,
    private articleService: ArticleService,
    private favorisService: FavorisService,
    private panierService: PanierService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.getPhotos();
    this.getCategory();
    this.getFournisseurs();
    this.loadFavoris(); // AJOUTER CETTE LIGNE
    
    const user = this.tokenStorageService.getUser();
    if (user && user.email) {
      this.articleForm.client.email = user.email;
    } else {
      console.error('Aucun utilisateur connecté');
    }
  }


  // Navigation entre les étapes
  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
      window.scrollTo(0, 0); // Remonter en haut de la page
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0); // Remonter en haut de la page
    }
  }

  // Navigation directe vers une étape (seulement si les étapes précédentes sont complétées)
  goToStep(step: number): void {
    if (step === 1 || this.canNavigateTo(step)) {
      this.currentStep = step;
      window.scrollTo(0, 0);
    }
  }

  // Vérifier si l'utilisateur peut naviguer vers une étape
  canNavigateTo(step: number): boolean {
    for (let i = 1; i < step; i++) {
      if (!this.stepCompleted[i]) {
        return false;
      }
    }
    return true;
  }

  // Validation avant de passer à l'étape suivante
  validateAndProceed(currentStepNum: number, nextStepNum: number): void {
    this.stepFormSubmitted = true;
    let isValid = true;

    // Validation de l'étape 1
    if (currentStepNum === 1) {
      if ( !this.articleForm.description || this.selectedFournisseurId <= 0) {
        isValid = false;
      }
    }
    
    // Validation de l'étape 2
    else if (currentStepNum === 2) {
      if (!this.articleForm.category || !this.articleForm.category.id||!this.articleForm.pointure||!this.articleForm.couleur||!this.articleForm.typePied||!this.articleForm.formePied||!this.articleForm.typeSemelle ) {
        isValid = false;
      }
    }
    
    // Validation de l'étape 3 - on peut toujours passer à l'étape suivante
    // même sans uploader de photos (peut-être l'utilisateur veut seulement utiliser des photos existantes)
    else if (currentStepNum === 3) {
      isValid = true;
    }

    this.stepErrors[currentStepNum] = !isValid;

    if (isValid) {
      // Marquer l'étape comme complétée
      this.stepCompleted[currentStepNum] = true;
      
      // Passer à l'étape suivante
      this.currentStep = nextStepNum;
      this.stepFormSubmitted = false; // Réinitialiser après changement d'étape
      window.scrollTo(0, 0); // Remonter en haut de la page
    } else {
      // Afficher un message d'erreur
      console.error(`Veuillez corriger les erreurs à l'étape ${currentStepNum}`);
    }
  }

  // Récupérer la liste des fournisseurs
  getFournisseurs(): void {
    this.articlePersonaliserService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        console.log('Fournisseurs récupérés:', this.fournisseurs);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des fournisseurs:', err);
      }
    });
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
    if ( this.articleForm.description && this.selectedFournisseurId > 0) {
      const emailClient = this.articleForm.client.email;
      
      this.articlePersonaliserService.createArticlePersonaliser(
        this.articleForm, 
        emailClient, 
        this.selectedFournisseurId
      ).subscribe({
        next: (data) => {
          console.log('Article personnalisé créé avec succès', data);
          this.router.navigate(['/articlePersonaliser']);
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'article personnalisé', err);
          alert('Erreur : ' + (err.error || 'Erreur inconnue lors de la création de l\'article'));
        }
      });
    } else {
      let errorMessage = 'Veuillez remplir tous les champs obligatoires';
      if (this.selectedFournisseurId <= 0) {
        errorMessage = 'Veuillez sélectionner un fournisseur';
      }
      alert(errorMessage);
      console.error(errorMessage);
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/articlePersonaliser']);
  }

  redirectToListFournisseur() {
    this.router.navigate(['/listFournisseur']);
  }

   // Mise à jour de la méthode onFournisseurChange
   onFournisseurChange(event: any): void {
    const selectedId = parseInt(event.target.value, 10);
    this.selectedFournisseurId = selectedId;
    
    // Trouver le fournisseur sélectionné
    this.selectedFournisseur = this.fournisseurs.find(f => f.id === selectedId) || null;
    
    if (this.selectedFournisseur) {
      this.articleForm.fournisseur = this.selectedFournisseur;
      console.log('Fournisseur sélectionné:', this.selectedFournisseur);
      
      // Charger les articles du fournisseur
      this.loadFournisseurArticles();
      
      // Afficher les détails (vous pouvez choisir modal ou en dessous)
      this.showFournisseurDetails = true; // Pour affichage en dessous
      // this.showFournisseurModal = true; // Pour modal
    } else {
      this.selectedFournisseur = null;
      this.articlesDuFournisseur = [];
      this.showFournisseurDetails = false;
      this.showFournisseurModal = false;
    }
  }

  // Charger les articles du fournisseur
  loadFournisseurArticles(): void {
    if (this.selectedFournisseur?.email) {
      this.articleService.getArticlesAccepterByFournisseur(this.selectedFournisseur.email).subscribe({
        next: (articles) => {
          this.articlesDuFournisseur = articles;
          
          // Initialiser les indices actifs pour chaque article
          this.articlesDuFournisseur.forEach(article => {
            if (article.id) {
              this.activeIndexes[article.id] = 0;
            }
          });
          
          console.log("Articles du fournisseur :", this.articlesDuFournisseur);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des articles:', err);
        }
      });
    }
  }

  // Fermer le modal
  closeFournisseurModal(): void {
    this.showFournisseurModal = false;
  }

  // Masquer les détails
  hideFournisseurDetails(): void {
    this.showFournisseurDetails = false;
  }

  // === MÉTHODES COPIÉES DE LISTFOURNISSEUR ===

  // Méthodes pour le carousel
  onSlide(event: any, articleId: number): void {
    if (articleId) {
      this.activeIndexes[articleId] = event.to;
    }
  }

  // Méthodes pour obtenir les informations des articles
  getUniqueColors(stocks: any[]): any[] {
    if (!stocks || !Array.isArray(stocks)) return [];
    
    const uniqueColorsMap = new Map();
    stocks.forEach(stock => {
      if (stock.couleur && !uniqueColorsMap.has(stock.couleur.id)) {
        uniqueColorsMap.set(stock.couleur.id, stock.couleur);
      }
    });
    
    return Array.from(uniqueColorsMap.values());
  }

  calculateTotalStock(stocks: any[]): number {
    if (!stocks || !Array.isArray(stocks)) return 0;
    
    return stocks.reduce((total, stock) => {
      return total + (stock.quantite || 0);
    }, 0);
  }

  getNomCouleur(couleurCode: string): string {
    const mapCouleurs: { [key: string]: string } = {
      '#3c2313': 'marron',
      '#ffffff': 'blanc',
      '#000000': 'noir',
    };
    return mapCouleurs[couleurCode] || couleurCode;
  }

  // Méthodes pour les favoris
  loadFavoris(): void {
    if (this.isLoggedIn()) {
      this.favorisService.getFavoris().subscribe({
        next: (favoris) => {
          this.favorisIds = favoris.map(f => f.article.id);
          console.log('Favoris chargés:', this.favorisIds);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des favoris:', err);
        }
      });
    }
  }

  isLoggedIn(): boolean {
    const user = this.tokenStorageService.getUser();
    return !!user && !!user.id;
  }

  isFavorite(articleId: number): boolean {
    if (this.favoritesStatus[articleId] !== undefined) {
      return this.favoritesStatus[articleId];
    }
    return this.favorisIds.includes(articleId);
  }

  toggleFavoris(article: Article): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.favorisService.toggleFavori(article.id).subscribe({
      next: (response) => {
        if (response && response.error) {
          console.error('Erreur:', response.error);
          alert(response.error);
          return;
        }

        const isFav = !this.isFavorite(article.id);
        this.favoritesStatus[article.id] = isFav;
        
        const index = this.favorisIds.indexOf(article.id);
        if (index > -1 && !isFav) {
          this.favorisIds.splice(index, 1);
        } else if (index === -1 && isFav) {
          this.favorisIds.push(article.id);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour des favoris:', err);
      }
    });
  }

  // Méthodes pour les détails et le panier
  viewArticleDetails(article: Article): void {
    if (article && article.id) {
      localStorage.setItem('previousUrl', this.router.url);
      this.router.navigate(['/detailArticle', article.id]);
    }
  }

  addToCart(article: Article): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['auth/client/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.selectedArticle = article;
    this.selectedCouleur = null;
    this.selectedPointure = null;
    this.selectedPointures = [];
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
    this.activePhotoIndex = 0;
    this.selectedStockInfo = null;
  }

  cancelAddToCart(): void {
    this.selectedArticle = null;
    this.selectedCouleur = null;
    this.selectedPointure = null;
    this.selectedPointures = [];
    this.stockInsuffisant = false;
    this.pointureOutOfStock = {};
  }

  selectCouleur(couleur: Couleur): void {
    this.selectedCouleur = couleur;
    this.stockInsuffisant = false;
    this.selectedPointure = null;
    this.pointureOutOfStock = {};
    this.selectedStockInfo = null;
    
    if (this.selectedArticle && this.selectedArticle.stocks?.length) {
      this.selectedPointures = this.selectedArticle.stocks
        .filter(stock => stock.couleur.id === couleur.id)
        .map(stock => stock.pointure);
      
      this.checkStockForAllSizes();
    } else {
      this.selectedPointures = [];
    }
  }

  checkStockForAllSizes(): void {
    if (!this.selectedArticle || !this.selectedCouleur || this.selectedPointures.length === 0) {
      return;
    }
    
    const stockRequests = this.selectedPointures.map(pointure => 
      this.stockService.getStockQuantity(
        this.selectedArticle!.id,
        this.selectedCouleur!.id,
        pointure.id
      ).pipe(
        catchError(err => {
          console.error(`Erreur lors de la vérification du stock:`, err);
          return of(0);
        })
      )
    );
    
    forkJoin(stockRequests).subscribe(results => {
      this.selectedPointures.forEach((pointure, index) => {
        const stockQuantity = results[index];
        this.pointureOutOfStock[pointure.id] = stockQuantity <= 0;
      });
    });
  }

  selectPointure(pointure: Pointure): void {
    if (this.pointureOutOfStock[pointure.id]) {
      return;
    }
    
    this.selectedPointure = pointure;
    this.stockInsuffisant = false;
    
    if (this.selectedArticle && this.selectedCouleur) {
      this.stockService.getStockQuantity(
        this.selectedArticle.id,
        this.selectedCouleur.id,
        pointure.id
      ).subscribe({
        next: (quantite) => {
          this.selectedStockInfo = quantite;
          
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

  confirmerAjoutAuPanier(): void {
    if (!this.selectedArticle) {
      alert("Aucun article sélectionné!");
      return;
    }
  
    if (!this.selectedCouleur) {
      alert("Veuillez sélectionner une couleur!");
      return;
    }
  
    if (!this.selectedPointure) {
      alert("Veuillez sélectionner une pointure!");
      return;
    }

    if (this.stockInsuffisant || this.pointureOutOfStock[this.selectedPointure.id]) {
      alert("Stock insuffisant pour cet article dans la couleur et pointure sélectionnées!");
      return;
    }
  
    this.panierService.ajouterAuPanier(this.selectedArticle, this.selectedCouleur, this.selectedPointure);
    alert(`${this.selectedArticle.name} ajouté au panier!`);
    
    this.selectedArticle = null;
  }
}