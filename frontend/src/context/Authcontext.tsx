// // context/AuthContext.tsx
// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { authService } from '@/services/Myauthservice';

// interface User {
//   id: string;
//   email: string;
// }

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   checkAuth: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   const checkAuth = async (): Promise<void> => {
//     try {
//       const { authenticated, user: currentUser } = await authService.checkAuth();
      
//       if (authenticated && currentUser) {
//         setUser(currentUser);
//         setIsAuthenticated(true);
//       } else {
//         setUser(null);
//         setIsAuthenticated(false);
//       }
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       setUser(null);
//       setIsAuthenticated(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
//     try {
//       await authService.signup(email, password, firstName, lastName);
//       // After successful signup, check auth status
//       await checkAuth();
//     } catch (error) {
//       console.error('Signup failed:', error);
//       throw error;
//     }
//   };

//   const signIn = async (email: string, password: string): Promise<void> => {
//     try {
//       await authService.login(email, password);
//       // After successful login, check auth status
//       await checkAuth();
//     } catch (error) {
//       console.error('Login failed:', error);
//       throw error;
//     }
//   };

//   const signOut = async (): Promise<void> => {
//     try {
//       await authService.logout();
//       setUser(null);
//       setIsAuthenticated(false);
//     } catch (error) {
//       console.error('Logout failed:', error);
//       throw error;
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     isAuthenticated,
//     isLoading,
//     signUp,
//     signIn,
//     signOut,
//     checkAuth,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };