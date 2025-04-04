import { AfterViewInit, Component, OnInit } from '@angular/core';
import {  Panier, PanierService } from '../services/panier.service';
import { Router } from '@angular/router';

declare var paypal:any;

@Component({
  selector: 'app-commande',
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})


export class CommandeComponent implements OnInit ,AfterViewInit{
  panier: Panier = { clientId: 0, lignesPanier: [], total: 0, statut: '', adresseLivraison: '' };  // Initialisation
  payer:boolean=false;
  constructor(private panierService: PanierService, private router: Router) {}

  ngAfterViewInit(): void {
   this.paypalButton();
  }

  ngOnInit(): void {
    this.panier = this.panierService.getPanier();  // Charger le panier depuis le service
  }

 
  paypalButton(): void {
    paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: this.panier.total.toFixed(2) }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          alert('Paiement réussi ! Merci, ' + details.payer.name.given_name);
        });
      }
    }).render('#paypal-button-container');
  }

  


  // Méthode pour valider la commande
  validerCommande(): void {
    if (this.panier.lignesPanier.length === 0) {
      alert('Votre panier est vide !');
      return;
    }
  
    // Pour chaque ligne de panier, mettre à jour le stock
    for (let ligne of this.panier.lignesPanier) {
      const articleId = ligne.article.id;
      const quantite = ligne.quantite;
  
      // Appeler la méthode pour mettre à jour le stock
      this.panierService.updateStock(articleId, quantite).subscribe({
        next: () => {
          console.log(`Stock de l'article ${articleId} mis à jour avec succès.`);
        },
        error: (err) => {
          console.error("Erreur lors de la mise à jour du stock :", err);
        }
      });
    }
  
    // Changer le statut de la commande après la validation
    this.panier.statut = 'COMMANDEE'; 
  
    // Sauvegarder le panier dans le localStorage
    this.panierService.sauvegarderPanierDansLocalStorage();
  
    // Afficher un message de succès
    alert('Commande validée avec succès !');
  }

  payement(){
    this.payer=true;
    
  }
  
}
