import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/Services/auth-service.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  userName: string='';
  password: string='';
  name:string='';
  re_pass:string='';
  formData: FormGroup;
  isPasswardDoesntMatch:boolean = false;

  constructor(private authService : AuthService, private router : Router) {
    this.formData = new FormGroup({
      name:new FormControl(""),
      userName: new FormControl("",Validators.required),
      password: new FormControl("",Validators.required),
      re_pass:new FormControl("",Validators.required)
   });
   }

  ngOnInit(): void {

  }

  onClickSubmit(data: any) {
    if(this.formData.value.password === this.formData.value.re_pass)
    {
      this.userName = data.userName;
      this.password = data.password;

      console.log("Login page: " + this.userName);
      console.log("Login page: " + this.password); 

      localStorage.setItem("userName",this.userName);
      localStorage.setItem("password",this.password);

      this.router.navigate(['/login']); 
    }
        
    this.isPasswardDoesntMatch=true;
 }
}
