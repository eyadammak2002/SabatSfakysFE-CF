import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Photo } from 'src/app/photo/Photo';
import { PhotoService } from 'src/app/photo/photo.service';
import { Article, Couleur, Pointure, Stock } from '../article';
import { ArticleService } from '../article.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/category/category';
import { CategoryService } from 'src/app/category/category.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { StockService } from 'src/app/panier/stock.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { forkJoin } from 'rxjs';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-article.component.html',
  styleUrls: ['./edit-article.component.css']
})
export class EditArticleComponent implements OnInit {
  selectedPhotos: Photo[] = [];
  allCategory: Category[] = [];
  allPhoto: Photo[] = [];
  couleursDisponibles: Couleur[] = [];
  pointuresDisponibles: Pointure[] = [];
  selectedCouleur: Couleur | null = null;
  selectedPointure: Pointure | null = null;
  quantite: number = 0;
  stockErrorMessage: string = ''; // Ajouté pour les messages d'erreur de stock

  // Upload properties
  selectedFiles?: FileList;
  currentFiles: File[] = [];
  progressInfos: { value: number, fileName: string }[] = [];
  uploadMessage: string = '';
  uploadSuccess: boolean = false;
  uploadError: boolean = false;
  newlyUploadedPhotos: Photo[] = [];
  isUploading: boolean = false;

  articleID: number = 0;
  articleStocks: Stock[] = [];

  articleForm: Article = {
    id: 0,
    ref: '',
    name: '',
    description: '',
    stocks: [],
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
    private stockService: StockService,
    private categoryService: CategoryService,
    private router: Router,
    private photoService: PhotoService,
    private tokenStorageService: TokenStorageService,
    private activatedRoute: ActivatedRoute,
    private uploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.getCouleurs();
    this.getPointures();
    this.getCategory();
    this.loadArticle();
  }
  
  loadArticle(): void {
    const articleId = this.activatedRoute.snapshot.paramMap.get('id');
    if (articleId) {
      const id = parseInt(articleId);
      this.articleID = id;
      
      this.articleService.getById(id).subscribe({
        next: (data) => {
          this.articleForm = data;
          this.articleStocks = data.stocks || [];
          
          // Une fois l'article chargé, récupérer ses photos
          this.photoService.getByArticleId(id).subscribe({
            next: (photos) => {
              this.allPhoto = photos;
              this.selectedPhotos = [...photos];
              this.articleForm.photos = [...this.selectedPhotos];
              console.log('Photos de l\'article chargées:', this.selectedPhotos);
            },
            error: (err) => {
              console.error('Erreur lors du chargement des photos de l\'article:', err);
            }
          });
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'article', err);
        }
      });
    } else {
      console.error('ID de l\'article manquant');
    }
  }
// Ajouter cette méthode pour modifier la quantité d'un stock
editStockQuantity(index: number): void {
  const newQuantity = prompt('Entrez la nouvelle quantité', this.articleStocks[index].quantite.toString());
  if (newQuantity !== null && !isNaN(+newQuantity) && +newQuantity > 0) {
    this.articleStocks[index].quantite = +newQuantity;
    console.log('Quantité mise à jour:', this.articleStocks[index]);
  } else {
    alert('Quantité invalide');
  }
}
  // Méthode pour comparer les catégories par ID
  compareCategories(c1: Category, c2: Category): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  // Vérifier si une combinaison couleur/pointure existe déjà
  combinaisonExists(couleur: Couleur, pointure: Pointure): boolean {
    return this.articleStocks.some(
      stock => stock.couleur.id === couleur.id && stock.pointure.id === pointure.id
    );
  }

  // Version modifiée pour vérifier les doublons
  generateStocks(): void {
    this.stockErrorMessage = '';
    
    if (this.selectedCouleur && this.selectedPointure && this.quantite > 0) {
      // Vérifier si cette combinaison existe déjà
      if (this.combinaisonExists(this.selectedCouleur, this.selectedPointure)) {
        this.stockErrorMessage = 'Cette combinaison couleur/pointure existe déjà dans votre stock.';
        return;
      }
      
      const stock: Stock = {
        id: 0, 
        couleur: this.selectedCouleur,
        pointure: this.selectedPointure,
        quantite: this.quantite
      };
      console.log('📌 Stock généré:', stock);
      this.articleStocks.push(stock);
      console.log('📦 Liste des stocks après ajout:', this.articleStocks);
      
      // Réinitialiser les champs après ajout
      this.selectedCouleur = null;
      this.selectedPointure = null;
      this.quantite = 0;
    } else {
      this.stockErrorMessage = 'Veuillez sélectionner une couleur, une pointure et indiquer une quantité valide.';
      console.error('❌ Veuillez sélectionner une couleur, une pointure et une quantité.');
    }
  }

  // Le reste de votre code reste inchangé...


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
    // Si un upload est déjà en cours, ne rien faire
    if (this.isUploading) {
      console.log('Upload déjà en cours, ignoré');
      return;
    }
  
    this.uploadMessage = '';
    this.uploadSuccess = false;
    this.uploadError = false;
    this.newlyUploadedPhotos = []; // Réinitialiser le tableau des nouvelles photos
    
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      this.isUploading = true; // Marquer l'upload comme en cours
      
      const uploadObservables = Array.from(this.selectedFiles).map((file, index) => {
        return this.uploadFile(file, index);
      });
    
      // Utiliser forkJoin pour attendre que tous les fichiers soient téléchargés
      forkJoin(uploadObservables).subscribe({
        next: (responses) => {
          this.uploadSuccess = true;
          this.uploadMessage = 'Toutes les photos ont été téléchargées avec succès et associées à l\'article.';
          
          this.selectedFiles = undefined;
          this.currentFiles = [];
          this.isUploading = false; // Réinitialiser le statut d'upload
        },
        error: (err) => {
          this.uploadError = true;
          this.uploadMessage = 'Une erreur est survenue lors du téléchargement de certaines photos.';
          console.error('Erreur lors du téléchargement des photos:', err);
          this.isUploading = false; // Réinitialiser le statut d'upload même en cas d'erreur
        }
      });
    }
  }

  // Version améliorée qui utilise directement uploadAndLinkPhoto
  uploadFile(file: File, index: number): any {
    return new Promise((resolve, reject) => {
      // Vérifier si ce fichier est déjà en cours d'upload
      if (this.progressInfos[index].value > 0) {
        console.log(`Fichier ${file.name} déjà en cours d'upload, ignoré`);
        resolve(null);
        return;
      }

      // Utiliser directement la nouvelle méthode uploadAndLinkPhoto
      this.photoService.uploadAndLinkPhoto(this.articleID, file).subscribe({
        next: (linkedPhoto) => {
          // Mettre à jour la progression à 100%
          this.progressInfos[index].value = 100;
          
          console.log('Photo téléchargée et liée à l\'article:', linkedPhoto);
          
          // Vérifier si cette photo n'est pas déjà présente dans la liste
          if (!this.newlyUploadedPhotos.some(p => p.name === linkedPhoto.name)) {
            // Ajouter la photo liée (avec ID correct) à notre liste
            this.newlyUploadedPhotos.push(linkedPhoto);
            
            // Ajouter aussi à la sélection courante et à la liste complète
            // Vérifier d'abord que la photo n'est pas déjà dans la liste
            if (!this.selectedPhotos.some(p => p.id === linkedPhoto.id)) {
              this.selectedPhotos.push(linkedPhoto);
            }
            
            if (!this.allPhoto.some(p => p.id === linkedPhoto.id)) {
              this.allPhoto.push(linkedPhoto);
            }
            
            // Mettre à jour les photos de l'article
            this.articleForm.photos = [...this.selectedPhotos];
            
            // Forcer la détection des changements
            this.cdr.detectChanges();
          }
          
          resolve(linkedPhoto);
        },
        error: (err) => {
          this.progressInfos[index].value = 0;
          this.uploadError = true;
          console.error('Erreur lors du téléchargement et de la liaison de la photo:', err);
          reject(err);
        }
      });
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

 
  // Helper method to check if a photo is selected (used in template)
  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotos.some(p => p.id === photoId);
  }

  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      // La photo est déjà sélectionnée, on la retire
      this.selectedPhotos.splice(index, 1);
    } else {
      // La photo n'est pas sélectionnée, on l'ajoute
      this.selectedPhotos.push(photo);
    }
    
    // Mettre à jour les photos de l'article
    this.articleForm.photos = [...this.selectedPhotos];
    
    // Forcer la détection des changements pour mettre à jour l'UI
    this.cdr.detectChanges();
    console.log('Photos sélectionnées:', this.selectedPhotos);
  }

  update(): void {
    if (this.articleForm.ref && this.articleForm.name && this.articleForm.prixFournisseur && this.articleForm.photos.length > 0 && this.articleStocks.length > 0) {
      this.articleForm.stocks = [...this.articleStocks];
      const emailFournisseur = this.articleForm.fournisseur.email;
      
      this.articleService.update(this.articleForm.id, this.articleForm, emailFournisseur).subscribe({
        next: (data) => {
          console.log('Article mis à jour avec succès', data);
          this.router.navigate(['/articles']);
        },
        error: (err) => console.error('Erreur lors de la mise à jour de l\'article', err)
      });
    } else {
      console.error('Veuillez remplir tous les champs obligatoires');
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/articles']);
  }
  
  deleteStock(index: number): void {
    const stockId = this.articleStocks[index].id;
  
    if (confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) {
      this.stockService.deleteStock(stockId).subscribe({
        next: (response) => {
          console.log('Stock supprimé du serveur:', response);
          this.articleStocks.splice(index, 1); // Supprimer du tableau après succès
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du stock:', error);
          
          // Vérifie si le backend a renvoyé un message lisible
          if (error.error && typeof error.error === 'string') {
            alert(error.error); // Affiche le message du backend
          } else {
            alert('❌ Une erreur est survenue lors de la suppression du stock.');
          }
        }
      });
    }
  }
  
  updateStockQuantity(index: number, newQuantity: number): void {
    if (newQuantity > 0 && this.articleStocks[index]) {
      this.articleStocks[index].quantite = newQuantity;
      
      const stockId = this.articleStocks[index].id;
  
      console.log('Updating stock with params:', {
        stockId,
        newQuantity
      });
  
      this.stockService.updateStock(stockId, newQuantity)
        .subscribe({
          next: (response) => console.log('Stock update response:', response),
          error: (error) => console.error('Stock update error:', error)
        });
    } else {
      console.error('Stock non trouvé ou quantité invalide.');
    }
  }
  
  
  
  // Version améliorée de deletePhoto qui met à jour toutes les listes
  deletePhoto(photo: any): void {
    // Vérifier d'abord que l'objet photo est valide et contient un ID
    console.log('Tentative de suppression de la photo:', photo);
    
    if (!photo) {
      console.error('Photo invalide');
      return;
    }
    
    // Déterminer l'ID de la photo (utiliser _id ou id selon votre modèle de données)
    const photoId = photo._id || photo.id;
    
    if (!photoId) {
      console.error('ID de photo manquant');
      return;
    }

    // Afficher une confirmation avant suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette photo: ${photo.name}?`)) {
      console.log('Suppression de la photo avec ID:', photoId);
      
      // Appel au service pour supprimer la photo
      this.photoService.deletePhoto(photoId).subscribe({
        next: () => {
          console.log('Photo supprimée avec succès:', photoId);
          
          // Mettre à jour les différentes listes de photos
          this.selectedPhotos = this.selectedPhotos.filter(p => p.id !== photoId);
          this.allPhoto = this.allPhoto.filter(p => p.id !== photoId);
          this.articleForm.photos = this.articleForm.photos.filter(p => p.id !== photoId);
          this.newlyUploadedPhotos = this.newlyUploadedPhotos.filter(p => p.id !== photoId);
          
          // Forcer la détection des changements pour mettre à jour l'UI
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la photo:', error);
          alert('Une erreur est survenue lors de la suppression de la photo.');
        }
      });
    }
  }
  
}