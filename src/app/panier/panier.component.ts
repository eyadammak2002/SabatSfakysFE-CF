import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Article } from '../article/article';
import { Panier, PanierService } from '../services/panier.service';
import { ArticleService } from '../article/article.service';
import { TokenStorageService } from '../services/token-storage.service';


declare var bootstrap: any;


@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  
  mapArticle: Map<number,number>=new Map();
  panier: any;
  clientId: number = 0;
  adresseLivraison: string = ''; 


  constructor(
    private panierService: PanierService,
    private router: Router,
    private tokenStorage: TokenStorageService
    
  ) {}

  ngOnInit(): void {
    this.chargerPanierClient();
  }

  

  // Charger le panier du client connecté
  chargerPanierClient(): void {
    this.panier = this.panierService.getPanier();
    
    for(var i=0;i<=this.panier.lignesPanier.length-1;i ++){
      console.log("id",this.panier.lignesPanier[i].article.id);
      this.mapArticle.set(this.panier.lignesPanier[i].article.id,this.panier.lignesPanier[i].article.qte)

    }
    console.log(this.mapArticle);
    //const articleId=this.panier.LignePanier.article.id
    console.log("charger Panier Client from, storage",this.panier);
    this.clientId = this.panier.clientId;
  }

  // Modifier la quantité d’un article
  modifierQuantite(index: number, changement: number,articleId :number): void {
    this.panierService.modifierQuantite(index, changement,articleId,this.mapArticle);
    
  }

  // Supprimer un article du panier
  supprimerLigne(index: number): void {
    this.panierService.supprimerDuPanier(index);
  }

  // Vider le panier
  viderPanier(): void {
    this.panierService.viderPanier();

    const panier = this.panierService.getPanier();
    if (panier && panier.statut === 'EN_COURS') {
      // Rediriger vers la page de détail de la commande
      this.router.navigate(['/commande']);
    }
  }


 // Valider le panier
// Valider le panier
createPanier(): void {
  if (this.panier.lignesPanier.length === 0) {
    alert('Ajoutez au moins un article au panier !');
    return;
  }

  if (!this.adresseLivraison || this.adresseLivraison.trim() === '') {
    alert('Veuillez entrer une adresse de livraison.');
    return;
  }

  // Créer une instance de panier avec l'adresse de livraison
  const panierAvecAdresse = { 
    ...this.panier,
    adresseLivraison: this.adresseLivraison  // Utiliser l'adresse de livraison entrée par l'utilisateur
  };

  console.log("🛒 Envoi du panier avec adresse au backend", panierAvecAdresse);

  // Récupérer l'ID de l'utilisateur (par exemple, depuis le service d'authentification ou le localStorage)
  const userId = this.tokenStorage.getUser().id; // Assurez-vous que la méthode getUser() renvoie l'utilisateur connecté

  // Appeler la méthode creerPanier pour créer le panier avec l'adresse
  this.panierService.creerPanier(userId, panierAvecAdresse).subscribe({
    next: (data) => {
      console.log("✅ Panier créé avec adresse de livraison :", data);
      alert("Panier créé avec succès avec l'adresse de livraison !");
      this.panierService.sauvegarderPanierDansLocalStorage();
      this.router.navigate(['/commande']); // Redirection après création

    },
    error: (err) => {
      console.error("❌ Erreur lors de la création du panier:", err);
      alert("Une erreur est survenue lors de la création du panier.");
    }
  });
}



  
}