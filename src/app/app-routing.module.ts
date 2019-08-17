import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NecklaceComponent } from './necklace/necklace.component';


const routes: Routes = [
  { path: '', component: NecklaceComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
