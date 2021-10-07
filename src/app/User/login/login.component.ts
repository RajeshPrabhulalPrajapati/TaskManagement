import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/Services/auth-service.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IpcRenderer } from 'electron';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private ipc: IpcRenderer | undefined;
  userName: string='';
  password: string='';
  formData: FormGroup;
  invalidCredentials:boolean = false;
  constructor(private authService : AuthService, private router : Router) {
    this.formData = new FormGroup({
      userName: new FormControl("",Validators.required),
      password: new FormControl("",Validators.required),
   });

   if ((<any>window).require) {
    try {
      this.ipc = (<any>window).require('electron').ipcRenderer;
    } catch (e) {
      throw e;
    }
  } else {
    console.warn('App not running inside Electron!');
  }

    // this.ipc?.on('loginResult', (event, user) => {
    //   if(user.userId)
    //   {
    //     //  localStorage.setItem('userData',JSON.stringify(user));
    //     this.router.navigate(['/note']);
    //   }
    //   this.invalidCredentials=true;
    //   console.log('loginResult', user);
    // });


   }

  ngOnInit() {  
 }


 onClickSubmit(data: any) {
    this.userName = data.userName;
    this.password = data.password;

    console.log("Login page: " + this.userName);
    console.log("Login page: " + this.password);

    this.ipc?.invoke('login',{userName: this.userName,password:this.password}).then((result) => {
      if(result && result.userId)
      {
        localStorage.setItem('userData',JSON.stringify(result));
        this.router.navigate(['/note']);
      }
      this.invalidCredentials=true;
      console.log('loginResult', result);
    });

    //this.authService.login(this.userName, this.password);
    //this.router.navigate(['/note']);
    //    .subscribe( data => { 
    //     //   console.log("Is Login Success: " + data); 
    
    //     //  if(data) 
    //     //  {
    //     //   this.router.navigate(['/notes']);
    //     //  }         
    //      this.invalidCredentials=true;
    // });
 }
}

