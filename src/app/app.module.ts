import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FruitsModule } from './fruits/fruits.module';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { EditPackComponent } from './pack/edit-pack/edit-pack.component';
import { CreatePackComponent } from './pack/create-pack/create-pack.component';
import { authInterceptor } from './auth.interceptor';
import { PanierComponent } from './panier/panier.component';
import { ListArticleComponent } from './article/list-article/list-article.component';
import { CommandeComponent } from './commande/commande.component';
import { ListCommandeComponent } from './commande/list-commande/list-commande.component';
import { ConfirmDialogComponent } from './components/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ArticleDetailComponent } from './article/article-detail/article-detail.component';
import { ErrorDialogComponent } from './components/error-dialog.component';
import { ArticleVueComponent } from './article/article-vue/article-vue.component';
import { ListCommandeFRComponent } from './commande/list-commande-fr/list-commande-fr.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileFournisseurComponent } from './components/profile-fournisseur/profile-fournisseur.component';
import { FavorisComponent } from './favoris/favoris.component';
import { ClientReclamationListComponent } from './article/client-reclamation-list/client-reclamation-list.component';
import { FiltredArticlesComponent } from './article/filtred-articles/filtred-articles.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { ChatComponent } from './chat/chat.component';
import { ArticlePersonaliserDetailComponent } from './article-personaliser/article-personaliser-detail/article-personaliser-detail.component';
import { FournisseurArticlesPersonalisesComponent } from './article-personaliser/fournisseur-articles-personalises/fournisseur-articles-personalises.component';
import { ForgetPasswordComponent } from './authentication/forget-password/forget-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { IntelligentSearchComponent } from './intelligent-search/intelligent-search.component';
import { ListReclamationComponent } from './fournisseur-dashboard/list-reclamation/list-reclamation.component';
import { AvisListComponent } from './fournisseur-dashboard/avis-list/avis-list.component';
import { DetailArticleAvisComponent } from './fournisseur-dashboard/detail-article-avis/detail-article-avis.component';
import { ListFournisseurComponent } from './article-personaliser/list-fournisseur/list-fournisseur.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    
    ListArticleComponent,
   
    ConfirmDialogComponent,
    ArticleDetailComponent,
    ErrorDialogComponent,
    ArticleVueComponent,
    
    ProfileFournisseurComponent,
    
    FiltredArticlesComponent,
    ChatbotComponent,
    ChatComponent,
    ResetPasswordComponent,
    IntelligentSearchComponent,
   
    DetailArticleAvisComponent,
        ListFournisseurComponent,

    
    

  ],
  imports: [
    FormsModule,
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
    AuthenticationComponent, 
    LoginComponent ,
    RouterModule,  
    ArticleComponent,
    CreateArticleComponent,
    EditArticleComponent ,
    ProduitComponent,
    CreateProduitComponent,
    EditProduitComponent,
    SocialLoginModule,
    GoogleSigninButtonModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    EditPackComponent,
    CreatePackComponent,
    PanierComponent,
    CommandeComponent,
    MatDialogModule,
    MatButtonModule,
    ClientReclamationListComponent,
    ArticlePersonaliserDetailComponent,
    FournisseurArticlesPersonalisesComponent,
    FournisseurDashboardComponent,
    ProfileComponent,
    FavorisComponent,
    ForgetPasswordComponent,
    ListCommandeComponent,
    ListCommandeFRComponent,
    ListReclamationComponent,
    AvisListComponent,

  ],
  exports: [
    ConfirmDialogComponent
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
    },
    provideHttpClient((withInterceptors([authInterceptor]))) ,

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
