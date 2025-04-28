import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LignePanier, Panier, PanierService } from '../services/panier.service';
import { TokenStorageService } from '../services/token-storage.service';
import { StockService } from './stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//solution pour error de polyfills car j'ai pas
declare var bootstrap: any;

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  
  stockDisponible: Map<string, number> = new Map();
  panier: any;
  clientId: number | null = null;
  adresseLivraison: string = ''; 

  constructor(
    private panierService: PanierService,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.chargerPanierClient();
  
     // Récupérer l'adresse de livraison stockée dans localStorage
    const adresseSauvegardee = localStorage.getItem('adresseLivraison');
    if (adresseSauvegardee) {
      this.adresseLivraison = adresseSauvegardee;
    }

    // Vérifier si l'adresse de livraison est renseignée
    if (this.panier.adresseLivraison && this.panier.adresseLivraison.trim() !== '') {
      // Si l'adresse de livraison n'est pas vide, rediriger vers la page de commande
      // this.router.navigate(['/commande']);
    }
  }

  // Charger le panier du client connecté ou du panier invité
  chargerPanierClient(): void {
    this.panier = this.panierService.getPanier();
    this.clientId = this.panier.clientId;
  
    // Si le panier a des lignes, charger les quantités de stock pour chaque produit
    if (this.panier.lignesPanier && this.panier.lignesPanier.length > 0) {
      this.panier.lignesPanier.forEach((ligne: LignePanier) => {
        console.log("LignePanier",ligne);
        const key = `${ligne.article.id}-${ligne.couleur.id}-${ligne.pointure.id}`;
      
        this.stockService.getStockQuantity(ligne.article.id, ligne.couleur.id, ligne.pointure.id)
          .subscribe(qte => {
            this.stockDisponible.set(key, qte);
          }, error => {
            console.error(`Erreur lors de la récupération du stock pour ${key}`, error);
          });
      });
    }
    
    console.log("Stock disponible chargé :", this.stockDisponible);
  }

  // Modifier la quantité d'un article
  modifierQuantite(index: number, changement: number, ligne: LignePanier): void {
    const couleurId = ligne.couleur.id;
    const pointureId = ligne.pointure.id;

    if (!couleurId || !pointureId) {
      console.error('couleurId ou pointureId est invalide');
      return;
    }

    const key = `${ligne.article.id}-${couleurId}-${pointureId}`;
    const stockMax = this.stockDisponible.get(key) ?? 0; 

    if (changement > 0 && ligne.quantite >= stockMax) {
      alert("❌ Quantité maximale atteinte !");
      return;
    }

    // Mettre à jour la quantité
    this.panierService.modifierQuantite(index, changement, ligne.article.id, couleurId, pointureId);
    this.panierService.sauvegarderPanierDansLocalStorage();
    this.updateTotal();
  }

  updateTotal(): void {
    this.panier.total = this.panier.lignesPanier.reduce((total: number, ligne: LignePanier) => {
      return total + (ligne.quantite * ligne.article.prixVente);
    }, 0);
  }
  
  // Supprimer un article du panier
  supprimerLigne(index: number): void {
    this.panierService.supprimerDuPanier(index);
    // Recharger le panier pour mettre à jour l'affichage
    this.chargerPanierClient();
  }

  // Vider le panier
  viderPanier(): void {
    this.panierService.viderPanier();
    // Recharger le panier vide
    this.chargerPanierClient();

    const panier = this.panierService.getPanier();
    if (panier && panier.statut === 'VALIDER') {
      // Rediriger vers la page de détail de la commande
      this.router.navigate(['/commande']);
    }
  }

  // Créer un panier et passer à la commande
  createPanier(): void {
    if (this.panier.lignesPanier.length === 0) {
      alert('Ajoutez au moins un article au panier !');
      return;
    }
  
    if (!this.adresseLivraison || this.adresseLivraison.trim() === '') {
      alert('Veuillez entrer une adresse de livraison.');
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    if (!user || !user.id) {
      // L'utilisateur n'est pas connecté
      // Sauvegarder l'adresse de livraison dans le panier invité
      this.panier.adresseLivraison = this.adresseLivraison;
      this.panier.statut = 'VALIDER';
      this.panierService.sauvegarderPanierDansLocalStorage();
      
      localStorage.setItem('adresseLivraison', this.adresseLivraison);

      // Rediriger vers la page de login avec URL de retour
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/panier' } 
      });
      return;
    }
    
    // Si l'utilisateur est connecté, continuer avec la création du panier
    // Mettre à jour l'adresse de livraison dans le panier en mémoire
    this.panier.adresseLivraison = this.adresseLivraison;
    this.panier.statut = 'VALIDER';
    this.panierService.sauvegarderPanierDansLocalStorage();

    // Créer une instance de panier avec l'adresse de livraison
    const panierAvecAdresse = { 
      ...this.panier,
      adresseLivraison: this.adresseLivraison,
      statut: "VALIDER"
    };
  
    console.log("🛒 Envoi du panier avec adresse au backend", panierAvecAdresse);
  
    // Récupérer l'ID de l'utilisateur
    const userId = user.id;
  
    // Appeler la méthode creerPanier pour créer le panier avec l'adresse
    this.panierService.creerPanier(userId, panierAvecAdresse).subscribe({
      next: (data) => {
        console.log("✅ Panier créé avec adresse de livraison :", data);
        alert("Panier créé avec succès avec l'adresse de livraison !");
        console.log('Panier créé avec ID:', data.id);
        localStorage.setItem('panierIdCMD', data.id);
        console.log('🆔 ID du panier sauvegardé dans localStorage :', localStorage.getItem('panierIdCMD'));


        // Mettre à jour le panier dans localStorage
        this.panierService.sauvegarderPanierDansLocalStorage();
        console.log('Panier créé aprés sauvgarde:', this.panierService);
          // Nettoyer le localStorage (AJOUTEZ CETTE LIGNE)
        localStorage.removeItem('adresseLivraison');


        // Redirection vers la page de commande
        console.log("Redirection vers commande...");
        this.router.navigate(['/commande']);
      },
      error: (err) => {
        console.error("❌ Erreur lors de la création du panier:", err);
        
        // Vérifier si l'erreur est due à une non-authentification (403 Forbidden)
        if (err.status === 403) {
          alert("Vous devez vous connecter pour finaliser votre commande.");
          
          // Sauvegarder l'état actuel du panier avant la redirection
          this.panier.adresseLivraison = this.adresseLivraison;
          this.panierService.sauvegarderPanierDansLocalStorage();
          
          // Rediriger vers la page de login avec URL de retour
          this.router.navigate(['/auth/client/login'], { 
            queryParams: { returnUrl: '/panier' } 
          });
        } else {
          alert("Une erreur est survenue lors de la création du panier.");
        }
      }
    });
  }
}