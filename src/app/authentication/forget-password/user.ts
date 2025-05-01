export enum ERole {
    ROLE_USER = 'ROLE_USER',
    ROLE_ADMIN = 'ROLE_ADMIN',
    ROLE_MODERATOR = 'ROLE_MODERATOR',
    ROLE_FOURNISSEUR = 'ROLE_FOURNISSEUR',
    ROLE_CLIENT = 'ROLE_CLIENT'
    // Ajoutez d'autres rôles selon votre ERole Java
  }
  
export class User {
    id?: number;
    username?: string;
    email: string="";
    password?: string;
    role?: ERole;
    role2?: ERole;
}

