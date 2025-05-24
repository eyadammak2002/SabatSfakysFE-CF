// contact.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactRequest } from './contact.model';
import { ContactService } from './contact.service';


@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup; // Utilisation de l'opérateur "!" définite assignment
  submitted = false;
  loading = false;
  success = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  // Initialize the form with validation
  initForm(): void {
    this.contactForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  // Getter for easy access to form fields
  get f() { 
    return this.contactForm.controls; 
  }

  // Handle form submission
  onSubmit(): void {
    this.submitted = true;
    this.success = false;
    this.error = '';

    // Stop if form is invalid
    if (this.contactForm.invalid) {
      return;
    }

    // Prépare les données pour l'envoi
    const contactRequest: ContactRequest = {
      fullName: this.contactForm.value.fullName,
      email: this.contactForm.value.email,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message
    };

    // Affiche un indicateur de chargement
    this.loading = true;
    
    // Envoie les données au service de contact pour l'envoi d'email
    this.contactService.sendContactEmail(contactRequest).subscribe({
      next: (response) => {
        console.log('Email envoyé avec succès!', response);
        this.success = true;
        this.submitted = false;
        this.loading = false;
        this.contactForm.reset();
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de l\'email:', err);
        this.error = 'Impossible d\'envoyer votre message. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }
}