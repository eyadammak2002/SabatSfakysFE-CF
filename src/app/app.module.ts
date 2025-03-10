import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FruitsModule } from './fruits/fruits.module';
import { HttpClientModule } from '@angular/common/http';
import { CategoryModule } from './category/category.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';

// ✅ Standalone Components doivent être importés, pas déclarés
import { AuthenticationComponent } from './authentication/authentification.component';
import { LoginComponent } from './authentication/login/login.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { FournisseurDashboardComponent } from './fournisseur-dashboard/fournisseur-dashboard.component';
import { ArticleComponent } from './article/article.component';
import { EditArticleComponent } from './article/edit-article/edit-article.component';
import { CreateArticleComponent } from './article/create-article/create-article.component';
import { GoogleLoginProvider, GoogleSigninButtonModule, SocialAuthServiceConfig, SocialLoginModule } from '@abacritt/angularx-social-login';
import { ProduitComponent } from './produit/produit.component';
import { CreateProduitComponent } from './produit/create-produit/create-produit.component';
import { EditProduitComponent } from './produit/edit-produit/edit-produit.component';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    FournisseurDashboardComponent,
 
   
    
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FruitsModule,
    HttpClientModule,
    CategoryModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AuthenticationComponent,  // ✅ Importé ici, pas déclaré !
    LoginComponent ,
    RouterModule,  
    ArticleComponent,
    CreateArticleComponent,
    EditArticleComponent ,
    ProduitComponent,
    CreateProduitComponent,
    EditProduitComponent,
    SocialLoginModule,
    GoogleSigninButtonModule, // Assure-toi que ce module est importé si tu veux utiliser ce bouton
    // ✅ Importé ici aussi
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        lang: 'en',
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '724978497148-q5485f8js8eiuqr374e11dsv7dqn6c67.apps.googleusercontent.com'
            )
          }/*,
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider('clientId')
          }*/
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
