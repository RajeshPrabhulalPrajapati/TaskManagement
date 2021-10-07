import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IpcRenderer } from 'electron';

import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

@Injectable({
   providedIn: 'root'
})
export class AuthService {

   isUserLoggedIn: boolean = false;
   private ipc: IpcRenderer | undefined;
  constructor(private router : Router) {
    if ((<any>window).require) {
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('App not running inside Electron!');
    }

    this.ipc?.on('loginResult', (event, user) => {
      console.log('loginResult', user);
      if(user.userId)
      {
        localStorage.setItem('userData',JSON.stringify(user));
         this.navigateToNotes();
      }
      else
      {
       // this.invalidCredentials=true;       
      }

    });

    this.ipc?.on('test', (event, msg) => {
      console.log('test ' ,msg);
    });
  };
   
  navigateToNotes()
  {
   this.router.navigate(['/note']);
  }

   login(userName: string, password: string){
      console.log(userName);
      console.log(password);     

      this.ipc?.send('login',{userName:userName,password:password});
   //    this.isUserLoggedIn = userName == localStorage.getItem("userName") && password == localStorage.getItem("password");
   //    localStorage.setItem('isUserLoggedIn', this.isUserLoggedIn ? "true" : "false"); 

   // return of(this.isUserLoggedIn).pipe(
   //    delay(1000),
   //    tap(val => { 
   //       console.log("Is User Authentication is successful: " + val); 
   //    })
   // );
   }

   logout(): void {
   this.isUserLoggedIn = false;
      localStorage.removeItem('isUserLoggedIn'); 
      localStorage.removeItem('userData'); 
      localStorage.removeItem('userName'); 
      localStorage.removeItem('password'); 
   }

   
}