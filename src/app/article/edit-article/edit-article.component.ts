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
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getCouleurs();
    this.getPointures();
    this.getPhotos();
    this.getCategory();
    this.loadArticle();
  }

  loadArticle(): void {
    const articleId = this.activatedRoute.snapshot.paramMap.get('id');
    if (articleId) {
      this.articleService.getById(parseInt(articleId)).subscribe({
        next: (data) => {
          this.articleForm = data;
          this.articleStocks = data.stocks || [];
          this.selectedPhotos = [...data.photos];
          this.selectedCouleur = this.articleForm.stocks.length > 0 ? this.articleForm.stocks[0].couleur : null;
          this.selectedPointure = this.articleForm.stocks.length > 0 ? this.articleForm.stocks[0].pointure : null;
        },
        error: (err) => console.error('❌ Erreur lors du chargement de l\'article', err)
      });
    }
  }

  getPhotos(): void {
    this.photoService.get().subscribe({
      next: (data) => (this.allPhoto = data),
      error: (err) => console.error(err)
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
  isPhotoSelected(photo: Photo): boolean {
    return this.articleForm.photos.some(p => p.id === photo.id);
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
          this.router.navigate(['/article']);
        },
        error: (err) => console.error('Erreur lors de la mise à jour de l\'article', err)
      });
    } else {
      console.error('Veuillez remplir tous les champs obligatoires');
    }
  }

  redirectToArticles(): void {
    this.router.navigate(['/article']);
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
  
  
}
