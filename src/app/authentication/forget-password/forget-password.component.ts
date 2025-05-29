import { Component } from '@angular/core';
import { User } from './user';
import { FormsModule } from '@angular/forms';
import { ForgetpasswordService } from '../forgetpassword.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent {
  user: User = new User();
  emailExists: boolean | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(
    private forgetPasswordService: ForgetpasswordService,
    private router: Router
  ) {}

  reinitialisation() {
    // Vérifier si l'email est valide
    if (!this.user.email || !this.isValidEmail(this.user.email)) {
      this.errorMessage = 'Veuillez saisir une adresse email valide.';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // D'abord vérifier si l'email existe
    this.forgetPasswordService.findByEmail(this.user.email).subscribe({
      next: (response: string) => {
        // Si l'email existe, envoyer le lien de réinitialisation
        this.forgetPasswordService.reinitialisation(this.user.email).subscribe({
          next: (resetResponse: string) => {
            this.isLoading = false;
            this.successMessage = resetResponse;
            
            // Redirection vers la page reset password après 2 secondes
            setTimeout(() => {
              this.router.navigate(['auth/client/reset-password']);
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = 'Erreur lors de l\'envoi du lien de réinitialisation.';
            console.error('Erreur reinitialisation:', error);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Cette adresse email n\'existe pas dans notre système.';
        console.error('Erreur vérification email:', error);
      }
    });
  }

  // Méthode pour valider le format de l'email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLogin() {
    this.router.navigate(['auth/client/login']);
  }
}