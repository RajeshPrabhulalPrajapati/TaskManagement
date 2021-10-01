import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/Services/auth-service.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userName: string='';
  password: string='';
  formData: FormGroup;
  invalidCredentials:boolean = false;
  constructor(private authService : AuthService, private router : Router) {
    this.formData = new FormGroup({
      userName: new FormControl("",Validators.required),
      password: new FormControl("",Validators.required),
   });
   }

  ngOnInit() {
   
 }

 onClickSubmit(data: any) {
    this.userName = data.userName;
    this.password = data.password;

    console.log("Login page: " + this.userName);
    console.log("Login page: " + this.password);

    this.authService.login(this.userName, this.password)
       .subscribe( data => { 
          console.log("Is Login Success: " + data); 
    
         if(data) 
         {
          this.router.navigate(['/notes']);
         }
         
         this.invalidCredentials=true;
    });
 }

}
