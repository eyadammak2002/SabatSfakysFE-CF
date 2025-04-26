import { Component, OnInit } from '@angular/core';
import { ReclamationService, Reclamation } from 'src/app/services/reclamation.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-reclamation-list',
  templateUrl: './client-reclamation-list.component.html',
  styleUrls: ['./client-reclamation-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ClientReclamationListComponent implements OnInit {
  reclamations: Reclamation[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  currentClientId: number | null = null;
  
  constructor(
    private reclamationService: ReclamationService,
    private tokenStorage: TokenStorageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du client connecté
    this.getCurrentClientId().then(clientId => {
      this.currentClientId = clientId;
      console.log("ID du client connecté:", this.currentClientId);
      
      if (this.currentClientId) {
        this.loadClientReclamations();
      } else {
        this.isLoading = false;
        this.errorMessage = "Impossible de récupérer vos informations client.";
      }
    });
  }

  // Récupérer l'ID du client connecté
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
    return this.reclamationService.getClientIdByEmail(email).toPromise()
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
        return null;
      });
  }

  // Charger les réclamations du client
  loadClientReclamations(): void {
    this.isLoading = true;
    
    // Ici, vous devez ajouter une méthode au service pour récupérer les réclamations par client
    // Si cette méthode n'existe pas encore, vous devrez l'ajouter au ReclamationService
    this.reclamationService.getReclamationsByClientId(this.currentClientId!).subscribe({
      next: (data) => {
        this.reclamations = data;
        this.isLoading = false;
        console.log("Réclamations du client chargées:", this.reclamations);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des réclamations:", err);
        this.isLoading = false;
        this.errorMessage = "Erreur lors du chargement de vos réclamations.";
      }
    });
  }

  // Supprimer une réclamation
  supprimerReclamation(reclamationId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
      this.reclamationService.deleteReclamation(reclamationId).subscribe({
        next: () => {
          // Filtrer la réclamation supprimée de la liste locale
          this.reclamations = this.reclamations.filter(rec => rec.id !== reclamationId);
          alert('Réclamation supprimée avec succès.');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la réclamation:', err);
          alert('Erreur lors de la suppression de la réclamation. Veuillez réessayer.');
        }
      });
    }
  }

  // Formater la date pour l'affichage
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  redirectAccueil() { this.router.navigate(['/accueil']); }

  
}