import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BannerComponent } from './components/banner/banner.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { AboutComponent } from './components/about/about.component';
import { LoginFournisseurComponent } from './authentication/login-fournisseur/login-fournisseur.component';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterFournisseurComponent } from './authentication/register-fournisseur/register-fournisseur.component';
import { RegisterComponent } from './authentication/register/register.component';
import { AuthenticationComponent } from './authentication/authentification.component';
import { PhotoComponent } from './photo/photo.component';
import { CreatePhotoComponent } from './photo/create-photo/create-photo.component';
import { ArticleComponent } from './article/article.component';
import { CreateArticleComponent } from './article/create-article/create-article.component';
import { EditArticleComponent } from './article/edit-article/edit-article.component';
import { CreatePackComponent } from './pack/create-pack/create-pack.component';
import { EditPackComponent } from './pack/edit-pack/edit-pack.component';
import { PackComponent } from './pack/pack.component';
import { PanierComponent } from './panier/panier.component';
import { ListArticleComponent } from './article/list-article/list-article.component';
import { CommandeComponent } from './commande/commande.component';
import { ListCommandeComponent } from './commande/list-commande/list-commande.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ArticleDetailComponent } from './article/article-detail/article-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileFournisseurComponent } from './components/profile-fournisseur/profile-fournisseur.component';
import { FavorisComponent } from './favoris/favoris.component';
import { ArticlePersonaliserComponent } from './article-personaliser/article-personaliser.component';
import { ArticleReclamationComponent } from './article/article-reclamation/article-reclamation.component';
import { AuthGuard } from './services/auth-guard';
import { CreateArticlePersonaliserComponent } from './article-personaliser/create-articlePersonaliser/create-articlePersonaliser.component';
import { FiltredArticlesComponent } from './article/filtred-articles/filtred-articles.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { ChatComponent } from './chat/chat.component';
import { ArticlePersonaliserDetailComponent } from './article-personaliser/article-personaliser-detail/article-personaliser-detail.component';
import { FournisseurArticlesPersonalisesComponent } from './article-personaliser/fournisseur-articles-personalises/fournisseur-articles-personalises.component';
import { ForgetPasswordComponent } from './authentication/forget-password/forget-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { ListCommandeFRComponent } from './commande/list-commande-fr/list-commande-fr.component';
import { IntelligentSearchComponent } from './intelligent-search/intelligent-search.component';
import { ListReclamationComponent } from './fournisseur-dashboard/list-reclamation/list-reclamation.component';
import { FournisseurDashboardComponent } from './fournisseur-dashboard/fournisseur-dashboard.component';
import { AvisListComponent } from './fournisseur-dashboard/avis-list/avis-list.component';
import { DetailArticleAvisComponent } from './fournisseur-dashboard/detail-article-avis/detail-article-avis.component';
import { ListFournisseurComponent } from './article-personaliser/list-fournisseur/list-fournisseur.component';
import { RevenusFournisseurComponent } from './fournisseur-dashboard/revenus-fournisseur/revenus-fournisseur.component';

export const routes: Routes = [
  { path: '', component: ListArticleComponent },
  { path: 'banner', component: BannerComponent },
  { path: 'about', component: AboutComponent },
  { path: 'photo', component: PhotoComponent },
  { path: 'createPhoto', component: CreatePhotoComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'favoris', component: FavorisComponent },

  {
    path: 'mes-reclamations',
    loadComponent: () => import('./article/client-reclamation-list/client-reclamation-list.component')
      .then(m => m.ClientReclamationListComponent),
    canActivate: [AuthGuard] // Assurez-vous que l'utilisateur est authentifié
  },
  {
    path: 'auth', component: AuthenticationComponent, children: [
      { path: '', redirectTo: 'client/login', pathMatch: 'full' },
      { path: 'client/login', component: LoginComponent },
      { path: 'client/register', component: RegisterComponent },

      { path: 'forgetPassword', component: ForgetPasswordComponent },

      { path: 'fournisseur/login', component: LoginFournisseurComponent },
      { path: 'fournisseur/register', component: RegisterFournisseurComponent }
    ]
  },
  
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'accueil', component: ListArticleComponent },
  { path: 'detailArticle/:id', component: ArticleDetailComponent },
  { path: 'detailArticleFR/:id', component:   DetailArticleAvisComponent
  },
  { path: 'articlereclamation/:id', component: ArticleReclamationComponent },
  { path: 'articlePersonaliser', component: ArticlePersonaliserComponent },
  { path: 'createArticlePersonaliser', component: CreateArticlePersonaliserComponent },
  { path: 'article-personaliser/:id', component: ArticlePersonaliserDetailComponent },
  
  { path: 'pack', component: PackComponent },
  { path: 'createPack', component: CreatePackComponent },
  { path: 'editPack/:id', component: EditPackComponent },

  { path: 'panier', component: PanierComponent },
  { path: 'commande', component: CommandeComponent },
  { path: 'listCommande', component: ListCommandeComponent },
  { path: 'listFournisseur', component:   ListFournisseurComponent  },

   // Routes pour le filtrage par catégorie
   { path: 'chaussures', component: FiltredArticlesComponent },
   { path: 'chaussures/:genre', component: FiltredArticlesComponent },
   { path: 'botte', component: FiltredArticlesComponent },
   { path: 'botte/:genre', component: FiltredArticlesComponent },
   { path: 'mocassins', component: FiltredArticlesComponent },
   { path: 'mocassins/:genre', component: FiltredArticlesComponent },
   
   // Routes pour le filtrage par genre
   { path: 'homme', component: FiltredArticlesComponent },
   { path: 'homme/:category', component: FiltredArticlesComponent },
   { path: 'femme', component: FiltredArticlesComponent },
   { path: 'femme/:category', component: FiltredArticlesComponent },
   { path: 'enfant', component: FiltredArticlesComponent },
   { path: 'enfant/:category', component: FiltredArticlesComponent },
   { path: 'chatbot', component: ChatbotComponent },
   { path: 'chat', component: ChatComponent },
   { path: 'search', component: IntelligentSearchComponent },
   
   { 
    path: '',
    component: FournisseurDashboardComponent, // Composant qui contient le layout commun
    canActivate: [AuthGuard], // Vérification d'authentification
    children: [
      { path: '', redirectTo: 'articles', pathMatch: 'full' },
      { path: 'articles', component: ArticleComponent },
      { path: 'createArticle', component: CreateArticleComponent },
      { path: 'editArticle/:id', component: EditArticleComponent },
      { path: 'listCommandeFR', component: ListCommandeFRComponent },
      { path: 'fournisseur/listReclamation', component: ListReclamationComponent },
      { path: 'fournisseur/listAvis', component: AvisListComponent }, 
      { path: 'fournisseur/articles-personalises',  component: FournisseurArticlesPersonalisesComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'settings', component: ProfileComponent },
      { path: 'profileFR', component: ProfileFournisseurComponent },
      { path: 'revenus', component: RevenusFournisseurComponent },

      
      // Ajoutez d'autres routes enfants selon besoin
    ]
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
