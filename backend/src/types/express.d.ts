export interface AuthUser {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Lo establece el middleware requireAuth */
      user?: AuthUser;
    }
  }
}
