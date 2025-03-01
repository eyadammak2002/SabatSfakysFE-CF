import { inject} from '@angular/core';
import { TokenStorageService } from './services/token-storage.service';
import {  HttpInterceptorFn } from '@angular/common/http';




export const authInterceptor:HttpInterceptorFn =
  
  

  (req, next)=>{
    const tokenstorage =inject(TokenStorageService) ;
    // Add authorization token to the request
    const authToken = tokenstorage.getToken();
    console.log(authToken);
    /*const authReq = req.clone({
      setHeaders: {
        Authorization: authToken
      }
    });*/

    
    const authUrlPattern = /\/auth|\/client|\/fournisseur|\/register|\/login/i;
    if (authUrlPattern.test(req.url)) {
      // If the URL matches authentication routes, proceed without modifying the request
      return next(req)
    }
      const authReq  = req.clone({
        setHeaders: { Authorization: `Bearer ${authToken}` }
      });
      console.log(authToken)
        // Log the modified request
      console.log('Modified Request:');
      console.log(authReq);

      return next(authReq)
  
  
    // Pass the request to the next interceptor or HttpClient
   
    /*
    .pipe(
      tap(
        event => {
          if (event instanceof HttpResponse) {
            // Log the response if needed
            console.log('Response Received:');
            console.log(event);
          }
        },
        error => {
          // Handle errors if any
          console.error('Error occurred:', error);
        }
      )
    );*/
  }

