import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotesGuardService } from 'src/Services/Guard/notes-guard.service';
import { NotesComponent } from './Notes/notes/notes.component';
import { LoginComponent } from './User/login/login.component';
import { RegisterComponent } from './User/register/register.component';

const routes: Routes = [
  {
    path:'',
    component:LoginComponent
  },
  // {
  //   path:'register',
  //   component:RegisterComponent
  // },
  {
    path:'note',
    component:NotesComponent    
  }
  // {
  //   path:'',
  //   component:RegisterComponent
  // },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
