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

const routes: Routes = [
  { path: '', component: ListArticleComponent },
  { path: 'banner', component: BannerComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'about', component: AboutComponent },
  { path: 'photo', component: PhotoComponent },
  { path: 'createPhoto', component: CreatePhotoComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profileFR', component: ProfileFournisseurComponent },
  { path: 'favoris', component: FavorisComponent },

  {
    path: 'mes-reclamations',
    loadComponent: () => import('./article/client-reclamation-list/client-reclamation-list.component')
      .then(m => m.ClientReclamationListComponent),
    canActivate: [AuthGuard] // Assurez-vous que l'utilisateur est authentifié
  }
  
,
  {
    path: 'auth', component: AuthenticationComponent, children: [
      { path: '', redirectTo: 'client/login', pathMatch: 'full' },
      { path: 'client/login', component: LoginComponent },
      { path: 'client/register', component: RegisterComponent },
      { path: 'fournisseur/login', component: LoginFournisseurComponent },
      { path: 'fournisseur/register', component: RegisterFournisseurComponent }
    ]
  },


  { path: 'article', component: ArticleComponent },
  { path: 'accueil', component: ListArticleComponent },
  { path: 'createArticle', component: CreateArticleComponent },
  { path: 'editArticle/:id', component: EditArticleComponent },
  { path: 'detailArticle/:id', component: ArticleDetailComponent },
  { path: 'articlereclamation/:id', component: ArticleReclamationComponent },
  { path: 'articlePersonaliser', component: ArticlePersonaliserComponent },
  { path: 'createArticlePersonaliser', component: CreateArticlePersonaliserComponent },
  { path: 'article-personaliser/:id', component: ArticlePersonaliserDetailComponent },
  { path: 'fournisseur/articles-personalises',  component: FournisseurArticlesPersonalisesComponent },
  
  { path: 'pack', component: PackComponent },
  { path: 'createPack', component: CreatePackComponent },
  { path: 'editPack/:id', component: EditPackComponent },

  { path: 'panier', component: PanierComponent },
  { path: 'commande', component: CommandeComponent },
  { path: 'listCommande', component: ListCommandeComponent },


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


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
