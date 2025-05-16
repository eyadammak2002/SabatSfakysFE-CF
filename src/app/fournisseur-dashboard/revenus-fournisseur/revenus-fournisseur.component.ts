// revenus-fournisseur.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevenusFournisseurService } from 'src/app/services/revenus-fournisseur.service';
// Importations pour PDF
// @ts-ignore
const pdfMake = require('pdfmake/build/pdfmake');
// @ts-ignore
const pdfFonts = require('pdfmake/build/vfs_fonts');

pdfMake.vfs = pdfFonts.vfs; // ✅ CORRECT

import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PanierService } from 'src/app/services/panier.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';

@Component({
  selector: 'app-revenus-fournisseur',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './revenus-fournisseur.component.html',
  styleUrls: ['./revenus-fournisseur.component.css']
})

export class RevenusFournisseurComponent implements OnInit {
  // Données de revenus
  revenuData: any = null;
  articlesRevenus: any[] = [];
  loading: boolean = false;
  isExporting: boolean = false; // Nouvel indicateur pour l'export PDF
  
  // Filtre de recherche
  searchTerm: string = '';
  email: string = ''; // Définir la propriété email
  fournisseur: any = null; 
  constructor(
    private revenusFournisseurService: RevenusFournisseurService,
      private tokenStorage: TokenStorageService,
        private fournisseurService: PanierService 
  ) { }
  ngOnInit(): void {
    const user = this.tokenStorage.getUser();
  
    if (user && user.email) {
      this.email = user.email;
  
      this.fournisseurService.getFournisseurByEmail(this.email)
        .subscribe({
          next: (fournisseur) => {
            this.fournisseur = fournisseur;
            console.log('Fournisseur trouvé :', this.fournisseur);
          },
          error: (err) => {
            console.error('Erreur lors de la récupération du fournisseur:', err);
          }
        });
    } else {
      console.warn("Email de l'utilisateur non disponible.");
    }

    this.loadRevenusData();

  }
  
  /**
   * Charge les données de revenus depuis l'API
   */
  loadRevenusData(): void {
    this.loading = true;
    
    this.revenusFournisseurService.getRevenusFournisseur().subscribe(
      (data) => {
        this.loading = false;
        this.revenuData = data;
        
        if (data && data.revenus) {
          this.articlesRevenus = data.revenus;
        }
      },
      (error) => {
        this.loading = false;
        console.error('Erreur de chargement des revenus:', error);
        alert('Erreur lors du chargement des revenus. Veuillez réessayer ultérieurement.');
      }
    );
  }
  
  /**
   * Filtre les articles par nom
   */
  get filteredArticles(): any[] {
    if (!this.searchTerm?.trim()) {
      return this.articlesRevenus;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.articlesRevenus.filter(article => 
      article.nomArticle.toLowerCase().includes(term) ||
      article.refArticle.toLowerCase().includes(term)
    );
  }
  
  /**
   * Formatte un montant en devise
   */
  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  }
  
  /**
   * Exporte les données de revenus en PDF
   */
  exportToPdf(): void {
    // Activer l'indicateur de chargement
    this.isExporting = true;
    
    // Créer un élément de chargement
    const loadingEl = document.createElement('div');
    loadingEl.className = 'pdf-loading-overlay';
    loadingEl.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Génération du PDF en cours...</p>
      </div>
    `;
    document.body.appendChild(loadingEl);
    
    // Charger le logo en premier
    const logoPromise = new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          // Créer un canvas pour convertir l'image en base64
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            // Convertir le canvas en base64
            const dataURL = canvas.toDataURL('image/png');
            console.log("Logo chargé avec succès");
            resolve(dataURL);
          } else {
            console.error('Impossible de créer le contexte 2d pour le logo');
            resolve('');
          }
        } catch (e) {
          console.error('Erreur lors de la conversion du logo:', e);
          resolve('');
        }
      };
      img.onerror = (e) => {
        console.error('Erreur lors du chargement du logo:', e);
        resolve(''); // En cas d'erreur, renvoyer une chaîne vide
      };
      img.src = 'assets/logo.png'; // Assurez-vous que ce chemin est correct
    });
    
    // Attendre que la promesse du logo soit résolue
    logoPromise.then(logoData => {
      console.log("Construction du PDF...");
      
      try {
        // Formater la date actuelle
        const dateString = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        // Créer le contenu du document
        const docDefinition: TDocumentDefinitions = {
          pageSize: 'A4',
          pageMargins: [40, 60, 40, 60],
          content: [
            // En-tête avec logo
            {
              columns: [
                // Logo à gauche
                logoData ? {
                  image: logoData,
                  width: 100,
                  alignment: 'left'
                } : {
                  text: 'Logo non disponible',
                  alignment: 'left',
                  italics: true
                },
                // Texte du titre à droite
                {
                  text: 'Sabat Sfakys',
                  style: 'header',
                  alignment: 'right',
                  margin: [0, 20, 0, 0]
                }
              ]
            },
            // Ligne de séparation
            {
              canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#dedede' }],
              margin: [0, 10, 0, 10]
            },
            // Titre du rapport
            {
              text: 'Rapport des Revenus par Fournisseur',
              style: 'title',
              alignment: 'center',
              margin: [0, 0, 0, 20]
            },
            {
              text: `Fournisseur: ${this.fournisseur?.nom || 'Non spécifié'}`,
              alignment: 'center',
              margin: [0, 0, 0, 20],
              style: 'subheader'
            },
            {
              text: `Email: ${this.fournisseur?.email || 'Non spécifié'}`,
              alignment: 'center',
              margin: [0, 0, 0, 20],
              style: 'subheader'
            }
            ,            
            // Date du rapport
            {
              text: `Généré le: ${dateString}`,
              alignment: 'right',
              margin: [0, 0, 0, 20]
            },
            // Résumé des revenus par fournisseur
            {
              text: 'Résumé des Revenus par Fournisseur',
              style: 'subheader',
              margin: [0, 0, 0, 10]
            },
            {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Fournisseur', style: 'tableHeader' },
                    { text: 'Nombre Articles', style: 'tableHeader' },
                    { text: 'Revenu Total (DT)', style: 'tableHeader' }
                  ],
                  // Utiliser les données de résumé si disponibles
                  ...(this.revenuData?.resumeParFournisseur || []).map((resume: any) => [
                    resume.nomFournisseur || 'Non spécifié',
                    { text: resume.nombreArticles?.toString() || '0', alignment: 'center' },
                    { text: this.formatCurrency(resume.revenuTotal), alignment: 'right' }
                  ]),
                  // Total général
                  [
                    { text: 'Total', bold: true },
                    { text: this.revenuData?.totalArticles?.toString() || '0', alignment: 'center', bold: true },
                    { text: this.formatCurrency(this.revenuData?.revenuTotal), alignment: 'right', bold: true }
                  ]
                ]
              },
              margin: [0, 0, 0, 20]
            },
            // Détails des revenus par article
            {
              text: 'Détails des Articles',
              style: 'subheader',
              margin: [0, 0, 0, 10]
            },
            this.filteredArticles.length > 0 ? {
              table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Réf', style: 'tableHeader' },
                    { text: 'Article', style: 'tableHeader' },
                    { text: 'Fournisseur', style: 'tableHeader' },
                    { text: 'Qté Vendue', style: 'tableHeader' },
                    { text: 'Prix Vente', style: 'tableHeader' },
                    { text: 'Revenu', style: 'tableHeader' }
                  ],
                  ...this.filteredArticles.map(article => [
                    { text: article.refArticle || '-', alignment: 'center' },
                    { text: article.nomArticle || 'Non spécifié' },
                    { text: article.nomFournisseur || 'Non spécifié' },
                    { text: article.quantite?.toString() || '0', alignment: 'center' }, // Changé de quantiteVendue à quantite
                    { text: this.formatCurrency(article.prixVente), alignment: 'right' },
                    { text: this.formatCurrency(article.revenuBrut), alignment: 'right' } // Changé de revenuTotal à revenuBrut
                  ])
                ]
              }
            } : {
              text: 'Aucun article à afficher pour le moment.',
              style: 'message',
              margin: [0, 10, 0, 10]
            },
            // Note de bas de page
            {
              text: 'Rapport généré automatiquement par le système Sabat Sfakys',
              style: 'footer',
              margin: [0, 30, 0, 0]
            }
          ],
          styles: {
            header: {
              fontSize: 22,
              bold: true,
              color: '#412e23'
            },
            title: {
              fontSize: 18,
              bold: true,
              color: '#5a4030'
            },
            title1: {
              fontSize: 18,
              bold: true,
              color: '#5a4030'
            },
            subheader: {
              fontSize: 16,
              bold: true,
              color: '#5a4030',
              margin: [0, 10, 0, 5]
            },
            tableHeader: {
              bold: true,
              fontSize: 12,
              fillColor: '#f8f9fa'
            },
            message: {
              fontSize: 12,
              italics: true,
              color: '#5a4030'
            },
            footer: {
              fontSize: 10,
              italics: true,
              alignment: 'center',
              color: '#666666'
            }
          }
        };
        
        console.log("Génération du PDF...");
        // Générer le PDF
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.download('rapport_revenus_fournisseur.pdf');
        
        console.log("PDF généré avec succès");
      } catch (e) {
        console.error("Erreur lors de la définition du document PDF:", e);
        alert(`Erreur lors de la génération du PDF: ${e}`);
      }
      
      // Nettoyer et désactiver l'indicateur de chargement
      document.body.removeChild(loadingEl);
      this.isExporting = false;
    })
    .catch(err => {
      console.error('Erreur lors de la génération du PDF:', err);
      document.body.removeChild(loadingEl);
      this.isExporting = false;
      alert(`Erreur lors de la génération du PDF: ${err.message}. Veuillez réessayer.`);
    });
  }
  
  /**
   * Méthode alternative d'export PDF utilisant jsPDF et html2canvas
   */
  exportToJsPdf(): void {
    this.isExporting = true;
    
    const loadingEl = document.createElement('div');
    loadingEl.className = 'pdf-loading-overlay';
    loadingEl.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Génération du PDF en cours...</p>
      </div>
    `;
    document.body.appendChild(loadingEl);
    
    // Sélectionner l'élément à exporter
    const element = document.getElementById('revenus-fournisseur-content');
    
    if (!element) {
      console.error("Élément 'revenus-fournisseur-content' non trouvé");
      document.body.removeChild(loadingEl);
      this.isExporting = false;
      return;
    }
    
    // Utiliser html2canvas pour convertir l'élément HTML en image
    html2canvas(element, {
      scale: 2, // Échelle plus élevée pour meilleure qualité
      logging: true,
      useCORS: true, // Permettre les images cross-origin
      allowTaint: true // Permettre les images qui pourraient "tainted" le canvas
    }).then(canvas => {
      // Créer un PDF au format A4
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculer les dimensions pour ajuster l'image à la page A4
      const imgWidth = 210; // largeur A4 en mm
      const pageHeight = 297; // hauteur A4 en mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Ajouter la première page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Télécharger le PDF
      pdf.save('rapport_revenus_fournisseur.pdf');
      
      // Nettoyer
      document.body.removeChild(loadingEl);
      this.isExporting = false;
    }).catch(err => {
      console.error('Erreur lors de la génération du PDF avec html2canvas:', err);
      document.body.removeChild(loadingEl);
      this.isExporting = false;
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    });
  }
}