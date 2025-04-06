import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LignePanier, Panier, PanierService } from '../services/panier.service';
import { TokenStorageService } from '../services/token-storage.service';
import { StockService } from './stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


declare var bootstrap: any;


@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  
  stockDisponible: Map<string, number> = new Map();
  panier: any;
  clientId: number = 0;
  adresseLivraison: string = ''; 


  constructor(
    private panierService: PanierService,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.chargerPanierClient();
  
    // Vérifier si l'adresse de livraison est renseignée
    if (this.panier.adresseLivraison && this.panier.adresseLivraison.trim() !== '') {
      // Si l'adresse de livraison n'est pas vide, rediriger vers la page de commande
     // this.router.navigate(['/commande']);
    }
  }
  

  


  // Charger le panier du client connecté
  chargerPanierClient(): void {
    this.panier = this.panierService.getPanier();
    this.clientId = this.panier.clientId;
  
    this.panier.lignesPanier.forEach((ligne: LignePanier) => {
      const key = `${ligne.article.id}-${ligne.couleur.id}-${ligne.pointure.id}`;
    
      this.stockService.getStockQuantity(ligne.article.id, ligne.couleur.id, ligne.pointure.id)
        .subscribe(qte => {
          this.stockDisponible.set(key, qte);
        }, error => {
          console.error(`Erreur lors de la récupération du stock pour ${key}`, error);
        });
    });
    
    console.log("Stock disponible chargé :", this.stockDisponible);
  }


  // Modifier la quantité d’un article
// Modifier la quantité d’un article
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
  }

  // Vider le panier
  viderPanier(): void {
    this.panierService.viderPanier();

    const panier = this.panierService.getPanier();
    if (panier && panier.statut === 'VALIDER') {
      // Rediriger vers la page de détail de la commande
      this.router.navigate(['/commande']);
    }
  }


  createPanier(): void {
    if (this.panier.lignesPanier.length === 0) {
      alert('Ajoutez au moins un article au panier !');
      return;
    }
  
    if (!this.adresseLivraison || this.adresseLivraison.trim() === '') {
      alert('Veuillez entrer une adresse de livraison.');
      return;
    }
    // Mettre à jour l'adresse de livraison dans le panier en mémoire
    this.panier.adresseLivraison = this.adresseLivraison;

    // Assurer que le statut est "VALIDER"
    this.panier.statut = 'VALIDER';

    // Appel à la méthode pour sauvegarder le panier mis à jour dans localStorage
    this.panierService.sauvegarderPanierDansLocalStorage();

    // Créer une instance de panier avec l'adresse de livraison
    const panierAvecAdresse = { 
      ...this.panier,
      adresseLivraison: this.adresseLivraison,  // Utiliser l'adresse de livraison entrée par l'utilisateur
      statut: "VALIDER"  // Assurer que le statut est VALIDER
    };
  
    console.log("🛒 Envoi du panier avec adresse au backend", panierAvecAdresse);
  
    // Récupérer l'ID de l'utilisateur
    const userId = this.tokenStorage.getUser().id;
  
    // Appeler la méthode creerPanier pour créer le panier avec l'adresse
    this.panierService.creerPanier(userId, panierAvecAdresse).subscribe({
      next: (data) => {
        console.log("✅ Panier créé avec adresse de livraison :", data);
        alert("Panier créé avec succès avec l'adresse de livraison !");
        
        // Mettre à jour le panier dans localStorage avec les nouvelles informations
        this.panierService.sauvegarderPanierDansLocalStorage();
  
 
  
        // Redirection vers la page de commande après un délai
     
          console.log("Redirection vers commande...");
          this.router.navigate(['/commande']);

      },
      error: (err) => {
        console.error("❌ Erreur lors de la création du panier:", err);
        alert("Une erreur est survenue lors de la création du panier.");
      }
    });
  }
  



  
}