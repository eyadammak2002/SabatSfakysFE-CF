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
photosNotHide: number[] = []; // IDs des photos à masquer

articleID:number=0;

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
    
    // Charger l'article d'abord, puis charger les photos liées à cet article
    this.loadArticle();  // Cela charge l'article et ses informations, y compris les photos liées.
    
    // Assurer que l'article est chargé avant de récupérer les photos liées
    this.loadArticle().then(() => {
      this.getPhotosArticle();  // Une fois l'article chargé, récupérer les photos liées.
      this.getPhotos();         // Ensuite, récupérer toutes les photos.
    });
  }
  
  loadArticle(): Promise<void> {
    return new Promise((resolve, reject) => {
      const articleId = this.activatedRoute.snapshot.paramMap.get('id');
      if (articleId) {
        const id = parseInt(articleId);
        this.articleID = id;
        this.articleService.getById(id).subscribe({
          next: (data) => {
            this.articleForm = data;
            this.articleStocks = data.stocks || [];
            this.selectedPhotos = [...data.photos];
            this.selectedCouleur = this.articleForm.stocks.length > 0 ? this.articleForm.stocks[0].couleur : null;
            this.selectedPointure = this.articleForm.stocks.length > 0 ? this.articleForm.stocks[0].pointure : null;
  
            // Charger les photos liées
            this.getPhotosArticle();
            resolve();  // Résoudre la Promise une fois l'article chargé
          },
          error: (err) => {
            console.error('❌ Erreur lors du chargement de l\'article', err);
            reject(err);  // Rejeter la Promise en cas d'erreur
          }
        });
      } else {
        reject(new Error('ID de l\'article manquant'));
      }
    });
  }
  
 
  // Méthode pour récupérer les photos de l'article avec l'ID de l'article
  getPhotosArticle(): void {
    if (this.articleID) {
      this.articleService.getById(this.articleID).subscribe({
        next: (article) => {
          this.selectedPhotos = article.photos || [];
          this.articleForm.photos = [...this.selectedPhotos]; // Mise à jour des photos de l'article

          // Extraire les IDs des photos liées pour les masquer dans la liste
          this.photosNotHide = this.selectedPhotos.map(photo => photo.id);
          console.log('Photos liées à l’article :', this.selectedPhotos);
          console.log('IDs des photos à masquer :', this.photosNotHide);
        },
        error: (err) => {
          console.error("Erreur lors de la récupération des photos de l'article:", err);
        }
      });
    }
  }


  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => {
        this.allPhoto = data;
        console.log('Photos récupérées:', this.allPhoto);
  
        // Si aucune photo n'a été nouvellement uploadée, récupérer tous les IDs des photos
        if (this.newlyUploadedPhotos.length === 0) {
          // Exclure les photos déjà liées à l'article (photos dans photosNotHide) de la liste des photos à masquer
          this.photosToHide = this.allPhoto
            .filter(photo => !this.photosNotHide.includes(photo.id))  // Filtrage basé sur l'ID
            .map(photo => photo.id);  // Extraire uniquement les IDs des photos
          console.log('Tous les IDs des photos à masquer (excluant celles déjà liées à l\'article) :', this.photosToHide);
        } else {
          // Mettre à jour la liste des photos sélectionnées après avoir uploadé des photos
          this.articleForm.photos = [...this.selectedPhotos];
          console.log('Photos sélectionnées après upload:', this.selectedPhotos);
        }
  
        console.log('IDs des photos à masquer:', this.photosToHide);
            // Forcer la détection des changements après modification des données
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des photos:', err);
      }
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
 /* isPhotoSelected(photo: Photo): boolean {
    return this.articleForm.photos.some(p => p.id === photo.id);
  }*/
  // Helper method to check if a photo is selected (used in template)
  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotos.some(p => p.id === photoId);
  }

  
  

  togglePhotoSelection(photo: Photo): void {
    const index = this.selectedPhotos.findIndex(p => p.id === photo.id);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photo);
    }
    this.articleForm.photos = [...this.selectedPhotos];
    this.cdr.markForCheck();
    console.log('Selected Photos:', this.articleForm.photos);
  }

  update(): void {
    if (this.articleForm.ref && this.articleForm.name && this.articleForm.prixFournisseur && this.articleForm.photos.length > 0 && this.articleStocks.length > 0) {
      this.articleForm.stocks = [...this.articleStocks];
      const emailFournisseur = this.articleForm.fournisseur.email;
      
      this.articleService.update(this.articleForm.id,this.articleForm, emailFournisseur).subscribe({
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
  
  
  editStockQuantity(index: number): void {
    const newQuantity = prompt('Entrez la nouvelle quantité', this.articleStocks[index].quantite.toString());
    if (newQuantity !== null && !isNaN(+newQuantity) && +newQuantity > 0) {
      this.updateStockQuantity(index, +newQuantity);
    } else {
      alert('Quantité invalide');
    }
  }
  
  
  // Méthode deletePhoto corrigée pour la page d'édition
deletePhoto(photo: any): void {
  // Vérifier d'abord que l'objet photo est valide et contient un ID
  console.log('Tentative de suppression de la photo:', photo);
  
  if (!photo) {
    console.error('Photo invalide');
    return;
  }
  
  // Inspecter l'objet pour trouver l'ID (que ce soit photo.id ou une autre propriété)
  console.log('Propriétés de l\'objet photo:', Object.keys(photo));
  
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
    this.photoService.deletePhoto(photoId).subscribe(
      () => {
        console.log('Photo supprimée avec succès:', photoId);
        
        // Masquer la photo supprimée dans l'interface utilisateur
        this.photosToHide.push(photoId);
        
        // Si la photo était sélectionnée, la retirer de la sélection
        if (this.isPhotoSelected(photoId)) {
          this.selectedPhotos = this.selectedPhotos.filter(p => {
            const selectedId = p.id;
            return selectedId !== photoId;
          });
        }
        
        // Afficher un message de succès
      },
      error => {
        console.error('Erreur lors de la suppression de la photo:', error);
      }
    );
  }
}

}
